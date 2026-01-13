namespace MyDarts.Api.Services.ThrowSources
{
    /// <summary>
    /// PLACEHOLDER: Future throw source for custom OpenCV-based dart detection.
    /// Will connect directly to cameras without requiring Autodarts.
    /// </summary>
    public class OpenCVThrowSource : IThrowSource
    {
        private readonly ILogger<OpenCVThrowSource> _logger;

        public string SourceId => "opencv";
        public string DisplayName => "Custom Camera (OpenCV)";
        public ThrowSourceStatus Status { get; private set; } = ThrowSourceStatus.Disconnected;

        public event EventHandler<DartDetectedEventArgs>? DartDetected;
        public event EventHandler<TakeoutDetectedEventArgs>? TakeoutDetected;
        public event EventHandler<ThrowSourceStatusChangedEventArgs>? StatusChanged;

        public OpenCVThrowSource(ILogger<OpenCVThrowSource> logger)
        {
            _logger = logger;
        }

        public Task<bool> IsAvailableAsync()
        {
            // TODO: Check if cameras are connected and calibrated
            return Task.FromResult(false);
        }

        public Task StartAsync()
        {
            // TODO: Implement OpenCV camera detection
            // 1. Connect to cameras
            // 2. Load calibration data
            // 3. Start detection loop
            // 4. Fire DartDetected events when darts land

            throw new NotImplementedException(
                "OpenCV detection not yet implemented. " +
                "Use Autodarts source for now.");
        }

        public Task StopAsync()
        {
            Status = ThrowSourceStatus.Disconnected;
            StatusChanged?.Invoke(this, new ThrowSourceStatusChangedEventArgs
            {
                Status = ThrowSourceStatus.Disconnected
            });
            return Task.CompletedTask;
        }

        // Future implementation notes:
        // - Use opencv-steel-darts or similar for reference
        // - Typical accuracy: 90-95% achievable
        // - Need calibration UI for board registration
        // - Support for 2-3 camera triangulation
    }
}