namespace MyDarts.Api.Models.Entities
{
    public class PlayerRecord
    {
        public int Id { get; set; }
        public int GameRecordId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int FinalPosition { get; set; }
        public int FinalScore { get; set; }
        public int TotalThrows { get; set; }
        public bool IsWinner { get; set; }
        public string ThrowsJson { get; set; } = "[]";

        // X01 specific
        public double? ThreeDartAverage { get; set; }
        public int? Checkout { get; set; }
        public int? OneEighties { get; set; }
        public int? OneFortiesPlus { get; set; }
        public int? TonPlus { get; set; }

        // Around the Clock specific
        public int? BestStreak { get; set; }

        // Navigation property
        public GameRecord GameRecord { get; set; } = null!;
    }
}