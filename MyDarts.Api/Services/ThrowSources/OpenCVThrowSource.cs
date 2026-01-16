using System.Net.Http.Json;
using System.Text.Json;

namespace MyDarts.Api.Services.ThrowSources
{
    /// <summary>
    /// Throw source that connects to custom Python OpenCV detection service.
    /// Communicates with the detection service running on port 8080.
    /// </summary>
    public class OpenCVThrowSource : IThrowSource
    {
        private readonly ILogger<OpenCVThrowSource> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _detectionServiceUrl;
        private CancellationTokenSource? _cancellationTokenSource;
        private Task? _pollingTask;

        public string SourceId => "opencv";
        public string DisplayName => "Custom Camera Detection";
        public ThrowSourceStatus Status { get; private set; } = ThrowSourceStatus.Disconnected;

        public event EventHandler<DartDetectedEventArgs>? DartDetected;
        public event EventHandler<TakeoutDetectedEventArgs>? TakeoutDetected;
        public event EventHandler<ThrowSourceStatusChangedEventArgs>? StatusChanged;

        public OpenCVThrowSource(
            ILogger<OpenCVThrowSource> logger,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(5);

            // Detection service runs on localhost:8080 (same Pi)
            _detectionServiceUrl = "http://localhost:8080";
        }

        public async Task<bool> IsAvailableAsync()
        {
            try
            {
                // Check if detection service is running
                var response = await _httpClient.GetAsync($"{_detectionServiceUrl}/health");
                if (!response.IsSuccessStatusCode)
                    return false;

                var health = await response.Content.ReadFromJsonAsync<HealthResponse>();

                // Available if service is running and at least one camera is calibrated
                return health?.CamerasConnected == true && health.Calibrated;
            }
            catch (Exception ex)
            {
                _logger.LogDebug("Detection service not available: {Error}", ex.Message);
                return false;
            }
        }

        public async Task StartAsync()
        {
            try
            {
                _logger.LogInformation("Starting custom camera detection...");

                UpdateStatus(ThrowSourceStatus.Connecting, "Checking detection service...");

                // Check if service is available
                if (!await IsAvailableAsync())
                {
                    throw new InvalidOperationException(
                        "Detection service is not available. " +
                        "Ensure the service is running and cameras are calibrated.");
                }

                // Start detection on the Python service
                var startResponse = await _httpClient.PostAsJsonAsync(
                    $"{_detectionServiceUrl}/start",
                    new { camera_indices = new[] { 0, 1, 2 }, resolution = new[] { 640, 480 } }
                );

                if (!startResponse.IsSuccessStatusCode)
                {
                    var error = await startResponse.Content.ReadAsStringAsync();
                    throw new InvalidOperationException($"Failed to start detection: {error}");
                }

                UpdateStatus(ThrowSourceStatus.Connected, "Detection active");

                // Start polling for events (temporary until WebSocket is implemented)
                _cancellationTokenSource = new CancellationTokenSource();
                _pollingTask = Task.Run(() => PollForEventsAsync(_cancellationTokenSource.Token));

                _logger.LogInformation("Custom camera detection started successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start custom camera detection");
                UpdateStatus(ThrowSourceStatus.Error, ex.Message);
                throw;
            }
        }

        public async Task StopAsync()
        {
            try
            {
                _logger.LogInformation("Stopping custom camera detection...");

                // Stop polling
                _cancellationTokenSource?.Cancel();
                if (_pollingTask != null)
                {
                    await _pollingTask;
                }

                // Stop detection on Python service
                await _httpClient.PostAsync($"{_detectionServiceUrl}/stop", null);

                UpdateStatus(ThrowSourceStatus.Disconnected, "Detection stopped");

                _logger.LogInformation("Custom camera detection stopped");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping detection");
            }
        }

        private async Task PollForEventsAsync(CancellationToken cancellationToken)
        {
            // This is a temporary polling solution
            // TODO: Replace with WebSocket connection to /events endpoint for real-time events

            _logger.LogInformation("Starting event polling (temporary solution)");

            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(100, cancellationToken); // Poll 10 times per second

                    // In a real implementation, we'd use WebSocket to /events endpoint
                    // For now, this is just a placeholder showing the architecture
                }
                catch (TaskCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in event polling");
                    await Task.Delay(1000, cancellationToken);
                }
            }
        }

        private void UpdateStatus(ThrowSourceStatus status, string? message = null)
        {
            Status = status;
            StatusChanged?.Invoke(this, new ThrowSourceStatusChangedEventArgs
            {
                Status = status,
                Message = message
            });
        }

        // Response models for detection service API
        private class HealthResponse
        {
            public bool CamerasConnected { get; set; }
            public bool Calibrated { get; set; }
            public bool IsRunning { get; set; }
        }

        private class DartEventResponse
        {
            public string Type { get; set; } = string.Empty;
            public string? Segment { get; set; }
            public int Value { get; set; }
            public int Multiplier { get; set; }
            public int DartNumber { get; set; }
            public double Confidence { get; set; }
            public string? Timestamp { get; set; }
        }
    }
}