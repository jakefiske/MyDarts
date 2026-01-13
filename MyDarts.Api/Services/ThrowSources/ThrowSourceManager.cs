using Microsoft.AspNetCore.SignalR;
using MyDarts.Api.Hubs;
using MyDarts.Api.Models.Requests;
using MyDarts.Api.Services.Interfaces;

namespace MyDarts.Api.Services.ThrowSources
{
    public class ThrowSourceManager : IThrowSourceManager
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<GameHub> _hubContext;
        private readonly ILogger<ThrowSourceManager> _logger;
        private readonly List<IThrowSource> _sources = new();
        private IThrowSource? _activeSource;
        private string? _boundGameId;

        public IThrowSource? ActiveSource => _activeSource;
        public IReadOnlyList<IThrowSource> AvailableSources => _sources.AsReadOnly();
        public string? BoundGameId => _boundGameId;

        public event EventHandler<DartDetectedEventArgs>? DartDetected;
        public event EventHandler<TakeoutDetectedEventArgs>? TakeoutDetected;

        public ThrowSourceManager(
            IServiceProvider serviceProvider,
            IHubContext<GameHub> hubContext,
            ILogger<ThrowSourceManager> logger)
        {
            _serviceProvider = serviceProvider;
            _hubContext = hubContext;
            _logger = logger;
        }

        public void RegisterSource(IThrowSource source)
        {
            if (_sources.Any(s => s.SourceId == source.SourceId))
            {
                _logger.LogWarning("Source {SourceId} already registered", source.SourceId);
                return;
            }

            _sources.Add(source);
            _logger.LogInformation("Registered throw source: {SourceId} ({DisplayName})",
                source.SourceId, source.DisplayName);
        }

        public IThrowSource? GetSource(string sourceId)
        {
            return _sources.FirstOrDefault(s => s.SourceId == sourceId);
        }

        public async Task ActivateSourceAsync(string sourceId)
        {
            var source = GetSource(sourceId);
            if (source == null)
            {
                throw new ArgumentException($"Unknown source: {sourceId}");
            }

            // Deactivate current source first
            await DeactivateAsync();

            _logger.LogInformation("Activating throw source: {SourceId}", sourceId);

            // Wire up events
            source.DartDetected += OnDartDetected;
            source.TakeoutDetected += OnTakeoutDetected;
            source.StatusChanged += OnStatusChanged;

            _activeSource = source;

            try
            {
                await source.StartAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start source {SourceId}", sourceId);
                // Clean up on failure
                source.DartDetected -= OnDartDetected;
                source.TakeoutDetected -= OnTakeoutDetected;
                source.StatusChanged -= OnStatusChanged;
                _activeSource = null;
                throw;
            }

            // Broadcast status to clients
            await _hubContext.Clients.All.SendAsync("ThrowSourceActivated", new
            {
                sourceId = source.SourceId,
                displayName = source.DisplayName,
                status = source.Status.ToString()
            });
        }

        public async Task DeactivateAsync()
        {
            if (_activeSource == null) return;

            _logger.LogInformation("Deactivating throw source: {SourceId}", _activeSource.SourceId);

            var sourceId = _activeSource.SourceId;

            // Unwire events
            _activeSource.DartDetected -= OnDartDetected;
            _activeSource.TakeoutDetected -= OnTakeoutDetected;
            _activeSource.StatusChanged -= OnStatusChanged;

            try
            {
                await _activeSource.StopAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping source {SourceId}", sourceId);
            }

            _activeSource = null;
            _boundGameId = null;

            await _hubContext.Clients.All.SendAsync("ThrowSourceDeactivated", new { sourceId });
        }

        public void BindToGame(string gameId)
        {
            _boundGameId = gameId;
            _logger.LogInformation("Bound throw source to game {GameId}", gameId);

            _hubContext.Clients.All.SendAsync("ThrowSourceBound", new { gameId });
        }

        public void Unbind()
        {
            var oldGameId = _boundGameId;
            _boundGameId = null;
            _logger.LogInformation("Unbound throw source from game {GameId}", oldGameId);

            _hubContext.Clients.All.SendAsync("ThrowSourceUnbound", new { gameId = oldGameId });
        }

        private void OnDartDetected(object? sender, DartDetectedEventArgs e)
        {
            _logger.LogInformation("Dart detected: {Segment} (dart {DartNumber})", e.Segment, e.DartNumber);

            // Raise event for any subscribers
            DartDetected?.Invoke(this, e);

            // Broadcast to SignalR clients
            _hubContext.Clients.All.SendAsync("DartDetected", new
            {
                segment = e.Segment,
                value = e.Value,
                multiplier = e.Multiplier,
                dartNumber = e.DartNumber,
                confidence = e.Confidence,
                timestamp = DateTime.UtcNow
            });

            // If bound to a game, process the throw
            if (_boundGameId != null)
            {
                ProcessThrowForGame(e);
            }
        }

        private void OnTakeoutDetected(object? sender, TakeoutDetectedEventArgs e)
        {
            _logger.LogInformation("Takeout detected");

            TakeoutDetected?.Invoke(this, e);

            _hubContext.Clients.All.SendAsync("TakeoutDetected", new
            {
                timestamp = e.Timestamp
            });
        }

        private void OnStatusChanged(object? sender, ThrowSourceStatusChangedEventArgs e)
        {
            _logger.LogInformation("Throw source status changed: {Status} - {Message}",
                e.Status, e.Message);

            _hubContext.Clients.All.SendAsync("ThrowSourceStatus", new
            {
                sourceId = _activeSource?.SourceId,
                status = e.Status.ToString(),
                message = e.Message,
                timestamp = DateTime.UtcNow
            });
        }

        private void ProcessThrowForGame(DartDetectedEventArgs e)
        {
            Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var gameService = scope.ServiceProvider.GetRequiredService<IGameService>();

                    var dartThrow = new DartThrow
                    {
                        Segment = e.Segment,
                        Value = e.Value,
                        Multiplier = e.Multiplier
                    };

                    await gameService.ProcessThrowAsync(_boundGameId!, dartThrow);
                    _logger.LogInformation("Throw processed for game {GameId}", _boundGameId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing throw for game {GameId}", _boundGameId);
                }
            });
        }
    }
}