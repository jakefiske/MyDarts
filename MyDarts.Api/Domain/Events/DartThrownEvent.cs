namespace MyDarts.Api.Domain.Events
{
    public class DartThrownEvent : GameEvent
    {
        public string PlayerId { get; set; } = string.Empty;
        public string PlayerName { get; set; } = string.Empty;
        public string Segment { get; set; } = string.Empty;
        public int Value { get; set; }
        public int Multiplier { get; set; }
        public bool WasHit { get; set; }
        public int ThrowNumberInTurn { get; set; }
    }
}
