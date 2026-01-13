namespace MyDarts.Api.Domain.Events
{
    public class StreakStartedEvent : GameEvent
    {
        public string PlayerId { get; set; } = string.Empty;
        public string PlayerName { get; set; } = string.Empty;
        public int ConsecutiveHits { get; set; }
    }
}
