using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using System.Text.Json;

namespace MyDarts.Api.Models.Responses
{
    public class GameResponse
    {
        public string GameId { get; set; } = string.Empty;
        public GameType GameType { get; set; }
        public GameStatus Status { get; set; }
        public List<PlayerResponse> Players { get; set; } = new();
        public int CurrentPlayerIndex { get; set; }
        public string? CurrentPlayerName { get; set; }
        public int ThrowsThisTurn { get; set; }
        public int ConsecutiveHits { get; set; }
        public bool IsOnStreak { get; set; }
        public string? WinnerName { get; set; }
        public bool TurnComplete { get; set; }
        public string? LastThrowMessage { get; set; }
        public List<ThrowResponse> CurrentTurnThrows { get; set; } = new();

        // Mickey Mouse bed/shanghai pending allocations
        public bool BedPendingAllocation { get; set; }
        public int BedNumber { get; set; }
        public bool ShanghaiPendingAllocation { get; set; }
        public int ShanghaiNumber { get; set; }

        public static GameResponse FromGameState(
            GameState game,
            Func<Player, string>? getTargetDisplay = null,
            Func<Player, string?>? getCheckout = null,
            Func<Player, bool>? getRequiresDoubleIn = null)
        {
            var currentPlayer = game.CurrentPlayer;
            var turnStartIndex = currentPlayer != null
                ? Math.Max(0, currentPlayer.Throws.Count - game.ThrowsThisTurn)
                : 0;

            var currentTurnThrows = currentPlayer?.Throws
                .Skip(turnStartIndex)
                .Take(game.ThrowsThisTurn)
                .Select((t, i) => ThrowResponse.FromSegment(t, i + 1))
                .ToList() ?? new List<ThrowResponse>();

            return new GameResponse
            {
                GameId = game.GameId,
                GameType = game.GameType,
                Status = game.Status,
                Players = game.Players.Select(p => PlayerResponse.FromPlayer(p, game.GameType, getTargetDisplay, getCheckout, getRequiresDoubleIn)).ToList(),
                CurrentPlayerIndex = game.CurrentPlayerIndex,
                CurrentPlayerName = currentPlayer?.Name,
                ThrowsThisTurn = game.ThrowsThisTurn,
                ConsecutiveHits = game.ConsecutiveHits,
                IsOnStreak = game.ThrowsThisTurn >= 3 && game.ConsecutiveHits >= 3,
                TurnComplete = game.TurnComplete,
                LastThrowMessage = game.LastThrowMessage,
                WinnerName = game.Winner?.Name,
                CurrentTurnThrows = currentTurnThrows,
                BedPendingAllocation = game.BedPendingAllocation,
                BedNumber = game.BedNumber,
                ShanghaiPendingAllocation = game.ShanghaiPendingAllocation,
                ShanghaiNumber = game.ShanghaiNumber
            };
        }
    }

    public class PlayerResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Position { get; set; }
        public int Score { get; set; }
        public string CurrentTargetDisplay { get; set; } = string.Empty;
        public int ThrowCount { get; set; }
        public bool IsWinner { get; set; }
        public string? CheckoutSuggestion { get; set; }
        public bool RequiresDoubleIn { get; set; }

        // Cricket-specific data
        public Dictionary<int, int>? CricketMarks { get; set; }

        // Mickey Mouse-specific data
        public MickeyMouseDataResponse? MickeyMouseData { get; set; }

        public static PlayerResponse FromPlayer(
            Player player,
            GameType gameType,
            Func<Player, string>? getTargetDisplay = null,
            Func<Player, string?>? getCheckout = null,
            Func<Player, bool>? getRequiresDoubleIn = null)
        {
            var response = new PlayerResponse
            {
                Id = player.Id,
                Name = player.Name,
                Position = player.Position,
                Score = player.Score,
                CurrentTargetDisplay = getTargetDisplay?.Invoke(player) ?? player.Position.ToString(),
                ThrowCount = player.Throws.Count,
                IsWinner = player.IsWinner,
                CheckoutSuggestion = getCheckout?.Invoke(player),
                RequiresDoubleIn = getRequiresDoubleIn?.Invoke(player) ?? false
            };

            // Add Cricket marks if playing Cricket
            if (gameType == GameType.Cricket)
            {
                var cricketData = player.GetGameData<CricketPlayerData>();
                if (cricketData != null)
                {
                    response.CricketMarks = cricketData.Marks;
                    response.Score = cricketData.Score;
                }
            }

            // Add Cricket marks if playing Cricket
            if (gameType == GameType.Cricket)
            {
                var cricketData = player.GetGameData<CricketPlayerData>();
                if (cricketData != null)
                {
                    response.CricketMarks = cricketData.Marks;
                    response.Score = cricketData.Score;
                }
            }

            // Add Mickey Mouse data if playing Mickey Mouse
            if (gameType == GameType.MickeyMouse)
            {
                var mmData = player.GetGameData<MickeyMousePlayerData>();
                if (mmData != null)
                {
                    response.MickeyMouseData = new MickeyMouseDataResponse
                    {
                        NumberMarks = mmData.NumberMarks,
                        DoublesMarks = mmData.DoublesMarks,
                        TriplesMarks = mmData.TriplesMarks,
                        BedsMarks = mmData.BedsMarks,
                        BullMarks = mmData.BullMarks
                    };
                    response.Score = mmData.Score;
                }
            }

            return response;
        }
    }
}