namespace MyDarts.Api.Domain.Events
{
    public abstract class GameEvent
    {
        public string GameId { get; set; } = string.Empty;
        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    }
}
