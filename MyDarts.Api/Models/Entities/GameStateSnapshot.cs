using MyDarts.Api.Models.Enums;

namespace MyDarts.Api.Models.Entities
{
    public class GameStateSnapshot
    {
        public string GameId { get; set; } = string.Empty;
        public GameType GameType { get; set; }
        public GameStatus Status { get; set; }
        public List<PlayerSnapshot> Players { get; set; } = new();
        public int CurrentPlayerIndex { get; set; }
        public int ThrowsThisTurn { get; set; }
        public int ConsecutiveHits { get; set; }
        public bool TurnComplete { get; set; }
        public string? LastThrowMessage { get; set; }
        public DateTime StartedAt { get; set; }
        public string? GameSettingsJson { get; set; }

        public static GameStateSnapshot FromGameState(GameState game)
        {
            return new GameStateSnapshot
            {
                GameId = game.GameId,
                GameType = game.GameType,
                Status = game.Status,
                Players = game.Players.Select(p => new PlayerSnapshot
                {
                    Id = p.Id,
                    Name = p.Name,
                    Position = p.Position,
                    Score = p.Score,
                    IsWinner = p.IsWinner,
                    Throws = new List<string>(p.Throws),
                    GameDataJson = p.GameDataJson
                }).ToList(),
                CurrentPlayerIndex = game.CurrentPlayerIndex,
                ThrowsThisTurn = game.ThrowsThisTurn,
                ConsecutiveHits = game.ConsecutiveHits,
                TurnComplete = game.TurnComplete,
                LastThrowMessage = game.LastThrowMessage,
                StartedAt = game.StartedAt,
                GameSettingsJson = game.GameSettingsJson
            };
        }

        public GameState ToGameState()
        {
            return new GameState
            {
                GameId = GameId,
                GameType = GameType,
                Status = Status,
                Players = Players.Select(p => new Player
                {
                    Id = p.Id,
                    Name = p.Name,
                    Position = p.Position,
                    Score = p.Score,
                    IsWinner = p.IsWinner,
                    Throws = new List<string>(p.Throws),
                    GameDataJson = p.GameDataJson
                }).ToList(),
                CurrentPlayerIndex = CurrentPlayerIndex,
                ThrowsThisTurn = ThrowsThisTurn,
                ConsecutiveHits = ConsecutiveHits,
                TurnComplete = TurnComplete,
                LastThrowMessage = LastThrowMessage,
                StartedAt = StartedAt,
                GameSettingsJson = GameSettingsJson
            };
        }
    }

    public class PlayerSnapshot
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Position { get; set; }
        public int Score { get; set; }
        public bool IsWinner { get; set; }
        public List<string> Throws { get; set; } = new();
        public string? GameDataJson { get; set; }
    }
}