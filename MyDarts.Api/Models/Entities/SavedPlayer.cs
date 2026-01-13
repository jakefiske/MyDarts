namespace MyDarts.Api.Models.Entities
{
    /// <summary>
    /// Represents a saved player profile that can be reused across games
    /// </summary>
    public class SavedPlayer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastPlayedAt { get; set; }
        public int GamesPlayed { get; set; } = 0;

        // Optional: Store favorite settings per player
        public int? PreferredGameType { get; set; }
        public string? Notes { get; set; }
    }
}