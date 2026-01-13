using Microsoft.AspNetCore.SignalR;
using MyDarts.Api.Hubs;
using MyDarts.Api.Services.Interfaces;
using SocketIOClient;
using System.Text.Json;

namespace MyDarts.Api.Services
{
    public interface IDartsCallerService
    {
        Task ConnectAsync(string url);
        Task DisconnectAsync();
        bool IsConnected { get; }
        string? CurrentUrl { get; }
    }

    public class DartsCallerService : IDartsCallerService, IDisposable
    {
        private readonly IHubContext<GameHub> _hubContext;
        private readonly ILogger<DartsCallerService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private SocketIOClient.SocketIO? _socket;
        private bool _disposed;

        public bool IsConnected => _socket?.Connected ?? false;
        public string? CurrentUrl { get; private set; }

        public DartsCallerService(
            IHubContext<GameHub> hubContext,
            ILogger<DartsCallerService> logger,
            IServiceProvider serviceProvider)
        {
            _hubContext = hubContext;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public async Task ConnectAsync(string url)
        {
            await DisconnectAsync();

            CurrentUrl = url;
            _logger.LogInformation("Connecting to darts-caller at {Url}", url);

            try
            {
                _socket = new SocketIOClient.SocketIO(url, new SocketIOOptions
                {
                    Transport = SocketIOClient.Transport.TransportProtocol.WebSocket,
                    ReconnectionAttempts = 5,
                    ReconnectionDelay = 2000
                });

                _socket.OnConnected += (sender, e) =>
                {
                    _logger.LogInformation("Connected to darts-caller");
                    BroadcastStatus("connected");
                };

                _socket.OnDisconnected += (sender, e) =>
                {
                    _logger.LogInformation("Disconnected from darts-caller: {Reason}", e);
                    BroadcastStatus("disconnected");
                };

                _socket.OnError += (sender, e) =>
                {
                    _logger.LogError("darts-caller error: {Error}", e);
                    BroadcastStatus("error", e);
                };

                _socket.OnAny((eventName, response) =>
                {
                    HandleEvent(eventName, response);
                });

                await _socket.ConnectAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to darts-caller");
                BroadcastStatus("error", ex.Message);
                throw;
            }
        }

        public async Task DisconnectAsync()
        {
            if (_socket != null)
            {
                await _socket.DisconnectAsync();
                _socket.Dispose();
                _socket = null;
                CurrentUrl = null;
            }
        }

        private void HandleEvent(string eventName, SocketIOResponse response)
        {
            try
            {
                var json = response.ToString();
                if (string.IsNullOrEmpty(json) || json == "[]")
                    return;

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                JsonElement data;
                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                    data = root[0];
                else
                    data = root;

                // Check for dart thrown events: dart1-thrown, dart2-thrown, dart3-thrown
                if (data.TryGetProperty("event", out var eventProp))
                {
                    var evt = eventProp.GetString() ?? "";
                    
                    if (evt.Contains("-thrown") && evt.StartsWith("dart"))
                    {
                        // This is a dart throw event
                        if (data.TryGetProperty("game", out var gameData))
                        {
                            if (gameData.TryGetProperty("fieldNumber", out var fieldNum) &&
                                gameData.TryGetProperty("fieldMultiplier", out var fieldMult))
                            {
                                var segment = fieldNum.ToString();
                                var multiplier = fieldMult.GetInt32();
                                
                                _logger.LogInformation(">>> DART THROWN: {Segment} x{Multiplier}", segment, multiplier);
                                ProcessThrow(segment, multiplier);
                            }
                        }
                    }
                }

                // Broadcast raw event to frontend for debugging
                _hubContext.Clients.All.SendAsync("DartsCallerEvent", new
                {
                    eventName,
                    data = json
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling darts-caller event: {Event}", eventName);
            }
        }

        private void ProcessThrow(string segment, int multiplier)
        {
            _logger.LogInformation(">>> Broadcasting throw to SignalR: {Segment} x{Multiplier}", segment, multiplier);
            
            _hubContext.Clients.All.SendAsync("DartsCallerThrow", new
            {
                segment,
                multiplier,
                timestamp = DateTime.UtcNow
            });

            Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var sessionManager = scope.ServiceProvider.GetRequiredService<IGameSessionManager>();
                    var gameService = scope.ServiceProvider.GetRequiredService<IGameService>();
                    
                    var games = sessionManager.GetActiveGames();
                    var latestGame = games.OrderByDescending(g => g.StartedAt).FirstOrDefault();
                    
                    if (latestGame != null)
                    {
                        var dartThrow = CreateDartThrow(segment, multiplier);
                        await gameService.ProcessThrowAsync(latestGame.GameId, dartThrow);
                        _logger.LogInformation(">>> Throw processed for game {GameId}", latestGame.GameId);
                    }
                    else
                    {
                        _logger.LogWarning(">>> No active game found for throw");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing throw for game");
                }
            });
        }

        private MyDarts.Api.Models.Requests.DartThrow CreateDartThrow(string segment, int multiplier)
        {
            int value = 0;
            string displaySegment = "";

            if (segment == "25")
            {
                // Bull: value is 25 for single bull, 50 for double bull (total points)
                value = multiplier == 2 ? 50 : 25;
                displaySegment = multiplier == 2 ? "DB" : "SB";
            }
            else if (segment == "0" || multiplier == 0)
            {
                // Miss
                value = 0;
                displaySegment = "MISS";
                multiplier = 0;
            }
            else if (int.TryParse(segment, out int segmentNumber))
            {
                // Regular segment: Value is the BASE segment number (1-20)
                // NOT the total points! The game engines use Value to check what number was hit.
                value = segmentNumber;
                displaySegment = multiplier switch
                {
                    3 => $"T{segmentNumber}",
                    2 => $"D{segmentNumber}",
                    _ => $"S{segmentNumber}"
                };
            }

            _logger.LogInformation(">>> CreateDartThrow: segment={Segment}, multiplier={Multiplier}, value={Value}, display={Display}", 
                segment, multiplier, value, displaySegment);

            return new MyDarts.Api.Models.Requests.DartThrow
            {
                Segment = displaySegment,
                Value = value,
                Multiplier = multiplier
            };
        }

        private void BroadcastStatus(string status, string? message = null)
        {
            _hubContext.Clients.All.SendAsync("DartsCallerStatus", new
            {
                status,
                message,
                url = CurrentUrl,
                timestamp = DateTime.UtcNow
            });
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _socket?.Dispose();
                _disposed = true;
            }
        }
    }
}
