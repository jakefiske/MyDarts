namespace MyDarts.Api.Models.Entities
{
    public class GameRecord
    {
        public int Id { get; set; }
        public string GameId { get; set; } = string.Empty;
        public string GameType { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? WinnerName { get; set; }
        public int TotalThrows { get; set; }
        public string PlayersJson { get; set; } = "[]";

        public List<PlayerRecord> Players { get; set; } = new();
    }
}