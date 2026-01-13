namespace MyDarts.Api.Models.Entities
{
    public class ThrowRecord
    {
        public int Id { get; set; }
        public string PlayerId { get; set; } = string.Empty;
        public int ThrowNumber { get; set; }
        public int Value { get; set; }
        public int Multiplier { get; set; }
        public string Segment { get; set; } = string.Empty;
        public DateTime ThrownAt { get; set; } = DateTime.UtcNow;

        public PlayerRecord Player { get; set; } = null!;
    }
}