using SocketIOClient;
using System.Text.Json;

namespace MyDarts.Api.Services.ThrowSources
{
    /// <summary>
    /// Throw source that connects to darts-caller Socket.IO server
    /// to receive dart detection events from Autodarts cameras.
    /// </summary>
    public class AutodartsThrowSource : IThrowSource, IDisposable
    {
        private readonly ILogger<AutodartsThrowSource> _logger;
        private readonly IConfiguration _configuration;
        private SocketIOClient.SocketIO? _socket;
        private bool _disposed;
        private int _currentDartNumber = 0;
        private string? _overrideUrl;

        public string SourceId => "autodarts";
        public string DisplayName => "Autodarts (darts-caller)";
        public ThrowSourceStatus Status { get; private set; } = ThrowSourceStatus.Disconnected;
        public string CurrentUrl => _overrideUrl ?? _configuration["DartsCaller:Url"] ?? "http://localhost:8079";

        public event EventHandler<DartDetectedEventArgs>? DartDetected;
        public event EventHandler<TakeoutDetectedEventArgs>? TakeoutDetected;
        public event EventHandler<ThrowSourceStatusChangedEventArgs>? StatusChanged;

        public AutodartsThrowSource(
            ILogger<AutodartsThrowSource> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public void SetUrl(string url)
        {
            _overrideUrl = url;
            _logger.LogInformation("Autodarts URL set to: {Url}", url);
        }

        public async Task<bool> IsAvailableAsync()
        {
            var url = CurrentUrl;
            if (string.IsNullOrEmpty(url)) return false;

            try
            {
                // Just check if we can reach the endpoint
                using var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = (_, _, _, _) => true
                };
                using var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(3) };
                var httpUrl = url.Replace("ws://", "http://").Replace("wss://", "https://");
                await client.GetAsync(httpUrl);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task StartAsync()
        {
            var url = CurrentUrl;
            if (string.IsNullOrEmpty(url))
            {
                throw new InvalidOperationException("DartsCaller URL not configured. Set DartsCaller:Url in appsettings.json or call SetUrl()");
            }

            await StopAsync();

            _logger.LogInformation("Connecting to darts-caller at {Url}", url);
            SetStatus(ThrowSourceStatus.Connecting);

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
                    _currentDartNumber = 0;
                    SetStatus(ThrowSourceStatus.Connected);
                };

                _socket.OnDisconnected += (sender, e) =>
                {
                    _logger.LogInformation("Disconnected from darts-caller: {Reason}", e);
                    SetStatus(ThrowSourceStatus.Disconnected, e);
                };

                _socket.OnError += (sender, e) =>
                {
                    _logger.LogError("darts-caller error: {Error}", e);
                    SetStatus(ThrowSourceStatus.Error, e);
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
                SetStatus(ThrowSourceStatus.Error, ex.Message);
                throw;
            }
        }

        public async Task StopAsync()
        {
            if (_socket != null)
            {
                try
                {
                    await _socket.DisconnectAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error disconnecting from darts-caller");
                }
                finally
                {
                    _socket.Dispose();
                    _socket = null;
                }
            }

            _currentDartNumber = 0;
            SetStatus(ThrowSourceStatus.Disconnected);
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

                if (!data.TryGetProperty("event", out var eventProp))
                    return;

                var evt = eventProp.GetString() ?? "";

                // Handle dart thrown events: dart1-thrown, dart2-thrown, dart3-thrown
                if (evt.Contains("-thrown") && evt.StartsWith("dart"))
                {
                    HandleDartThrown(evt, data);
                }
                // Handle darts pulled (takeout)
                else if (evt == "darts-pulled")
                {
                    HandleDartsPulled();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling darts-caller event: {Event}", eventName);
            }
        }

        private void HandleDartThrown(string evt, JsonElement data)
        {
            // Extract dart number from event name (dart1-thrown, dart2-thrown, dart3-thrown)
            var dartNum = evt[4] - '0'; // Gets 1, 2, or 3
            _currentDartNumber = dartNum;

            if (!data.TryGetProperty("game", out var gameData))
                return;

            if (!gameData.TryGetProperty("fieldNumber", out var fieldNum) ||
                !gameData.TryGetProperty("fieldMultiplier", out var fieldMult))
                return;

            var segment = fieldNum.ToString();
            var multiplier = fieldMult.GetInt32();

            // Parse coordinates if available
            (double X, double Y)? coords = null;
            if (gameData.TryGetProperty("coords", out var coordsData) &&
                coordsData.TryGetProperty("x", out var x) &&
                coordsData.TryGetProperty("y", out var y))
            {
                coords = (x.GetDouble(), y.GetDouble());
            }

            var (displaySegment, value) = ParseSegment(segment, multiplier);

            _logger.LogInformation(">>> DART {DartNum} THROWN: {Segment} (value={Value}, mult={Mult})",
                dartNum, displaySegment, value, multiplier);

            DartDetected?.Invoke(this, new DartDetectedEventArgs
            {
                Segment = displaySegment,
                Value = value,
                Multiplier = multiplier,
                DartNumber = dartNum,
                Coordinates = coords
            });
        }

        private void HandleDartsPulled()
        {
            _logger.LogInformation(">>> DARTS PULLED (takeout)");
            _currentDartNumber = 0;

            TakeoutDetected?.Invoke(this, new TakeoutDetectedEventArgs
            {
                Timestamp = DateTime.UtcNow
            });
        }

        private (string displaySegment, int value) ParseSegment(string segment, int multiplier)
        {
            if (segment == "25")
            {
                // Bull
                return multiplier == 2 ? ("DB", 25) : ("SB", 25);
            }

            if (segment == "0" || multiplier == 0)
            {
                // Miss
                return ("MISS", 0);
            }

            if (int.TryParse(segment, out int segmentNumber))
            {
                // Regular segment - value is the base number (1-20)
                var displaySegment = multiplier switch
                {
                    3 => $"T{segmentNumber}",
                    2 => $"D{segmentNumber}",
                    _ => $"S{segmentNumber}"
                };
                return (displaySegment, segmentNumber);
            }

            return ("MISS", 0);
        }

        private void SetStatus(ThrowSourceStatus status, string? message = null)
        {
            Status = status;
            StatusChanged?.Invoke(this, new ThrowSourceStatusChangedEventArgs
            {
                Status = status,
                Message = message
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