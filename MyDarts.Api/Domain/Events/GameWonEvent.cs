namespace MyDarts.Api.Domain.Events
{
    public class GameWonEvent : GameEvent
    {
        public string WinnerId { get; set; } = string.Empty;
        public string WinnerName { get; set; } = string.Empty;
        public int TotalThrows { get; set; }
    }
}
