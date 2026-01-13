namespace MyDarts.Api.Services.ThrowSources
{
    /// <summary>
    /// Abstraction for dart throw detection sources.
    /// Allows swapping between Autodarts, OpenCV, or other detection methods.
    /// </summary>
    public interface IThrowSource
    {
        string SourceId { get; }
        string DisplayName { get; }
        ThrowSourceStatus Status { get; }

        event EventHandler<DartDetectedEventArgs>? DartDetected;
        event EventHandler<TakeoutDetectedEventArgs>? TakeoutDetected;
        event EventHandler<ThrowSourceStatusChangedEventArgs>? StatusChanged;

        Task StartAsync();
        Task StopAsync();
        Task<bool> IsAvailableAsync();
    }

    public enum ThrowSourceStatus
    {
        Disconnected,
        Connecting,
        Connected,
        Error
    }

    public class DartDetectedEventArgs : EventArgs
    {
        /// <summary>Display segment like "T20", "D16", "SB", "DB", "MISS"</summary>
        public required string Segment { get; init; }

        /// <summary>Base value (1-20, or 25 for bull)</summary>
        public int Value { get; init; }

        /// <summary>Multiplier (1=single, 2=double, 3=triple)</summary>
        public int Multiplier { get; init; }

        /// <summary>Which dart in the turn (1, 2, or 3)</summary>
        public int DartNumber { get; init; }

        /// <summary>Detection confidence 0-1 (if available)</summary>
        public double? Confidence { get; init; }

        /// <summary>Board coordinates (if available)</summary>
        public (double X, double Y)? Coordinates { get; init; }
    }

    public class TakeoutDetectedEventArgs : EventArgs
    {
        public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    }

    public class ThrowSourceStatusChangedEventArgs : EventArgs
    {
        public required ThrowSourceStatus Status { get; init; }
        public string? Message { get; init; }
    }
}