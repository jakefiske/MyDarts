namespace MyDarts.Api.Domain.Events
{
    public class TurnEndedEvent : GameEvent
    {
        public string PlayerId { get; set; } = string.Empty;
        public string PlayerName { get; set; } = string.Empty;
        public string NextPlayerId { get; set; } = string.Empty;
        public string NextPlayerName { get; set; } = string.Empty;
        public int TotalThrowsInTurn { get; set; }
        public int HitsInTurn { get; set; }
    }
}
