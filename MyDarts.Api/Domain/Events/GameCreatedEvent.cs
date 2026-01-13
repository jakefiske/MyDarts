namespace MyDarts.Api.Domain.Events
{
    public class GameCreatedEvent : GameEvent
    {
        public string GameType { get; set; } = string.Empty;
        public List<string> PlayerNames { get; set; } = new();
    }
}
