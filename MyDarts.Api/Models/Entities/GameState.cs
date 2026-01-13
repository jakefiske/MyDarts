using System.Text.Json;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;

namespace MyDarts.Api.Models.Entities
{
    public class GameState
    {
        public string GameId { get; set; } = Guid.NewGuid().ToString();
        public GameType GameType { get; set; } = GameType.AroundTheClockTurbo;
        public GameStatus Status { get; set; } = GameStatus.WaitingForPlayers;
        public List<Player> Players { get; set; } = new();
        public int CurrentPlayerIndex { get; set; } = 0;
        public int ThrowsThisTurn { get; set; } = 0;
        public int ConsecutiveHits { get; set; } = 0;
        public bool TurnComplete { get; set; } = false;
        public string? LastThrowMessage { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        // Mickey Mouse: Pending bed allocation
        public bool BedPendingAllocation { get; set; } = false;
        public int BedNumber { get; set; } = 0;
        // Mickey Mouse: Pending shanghai allocation
        public bool ShanghaiPendingAllocation { get; set; } = false;
        public int ShanghaiNumber { get; set; } = 0;

        // Game-level settings (persisted)
        public string? GameSettingsJson { get; set; }

        public Player? CurrentPlayer => Players.Count > 0 ? Players[CurrentPlayerIndex] : null;
        public Player? Winner => Players.FirstOrDefault(p => p.IsWinner);

        // Remove the old Dictionary - we now use typed data on Player
    }
}