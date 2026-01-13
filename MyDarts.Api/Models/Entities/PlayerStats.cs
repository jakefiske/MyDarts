namespace MyDarts.Api.Models.Entities
{
    public class PlayerStats
    {
        public string PlayerName { get; set; } = string.Empty;

        // General stats
        public int GamesPlayed { get; set; }
        public int GamesWon { get; set; }
        public double WinPercentage => GamesPlayed > 0 ? (double)GamesWon / GamesPlayed * 100 : 0;

        // X01 stats
        public double ThreeDartAverage { get; set; }
        public int HighestCheckout { get; set; }
        public int TotalCheckouts { get; set; }
        public int CheckoutAttempts { get; set; }
        public double CheckoutPercentage => CheckoutAttempts > 0 ? (double)TotalCheckouts / CheckoutAttempts * 100 : 0;
        public int OneEighties { get; set; }
        public int OneFortiesPlus { get; set; }
        public int TonPlus { get; set; } // 100+

        // Around the Clock stats
        public int BestStreak { get; set; }
        public int FastestGame { get; set; } // Fewest throws to complete

        // Recent form
        public List<GameSummary> RecentGames { get; set; } = new();
    }

    public class GameSummary
    {
        public string GameId { get; set; } = string.Empty;
        public string GameType { get; set; } = string.Empty;
        public DateTime PlayedAt { get; set; }
        public bool Won { get; set; }
        public int TotalThrows { get; set; }
        public double? ThreeDartAvg { get; set; }
        public int? Checkout { get; set; }
    }
}