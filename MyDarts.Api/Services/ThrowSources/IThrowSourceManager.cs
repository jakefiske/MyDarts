namespace MyDarts.Api.Services.ThrowSources
{
    /// <summary>
    /// Manages throw sources and routes detected throws to games.
    /// </summary>
    public interface IThrowSourceManager
    {
        IThrowSource? ActiveSource { get; }
        IReadOnlyList<IThrowSource> AvailableSources { get; }
        string? BoundGameId { get; }

        event EventHandler<DartDetectedEventArgs>? DartDetected;
        event EventHandler<TakeoutDetectedEventArgs>? TakeoutDetected;

        void RegisterSource(IThrowSource source);
        Task ActivateSourceAsync(string sourceId);
        Task DeactivateAsync();
        void BindToGame(string gameId);
        void Unbind();
        IThrowSource? GetSource(string sourceId);
    }
}