using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyDarts.Api.Data;
using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Services.Interfaces;

namespace MyDarts.Api.Services.Repositories
{
    public class SqliteGameRepository : IGameRepository
    {
        private readonly AppDbContext _context;

        public SqliteGameRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task SaveGameAsync(GameState game)
        {
            var existingRecord = await _context.Games
                .Include(g => g.Players)
                .FirstOrDefaultAsync(g => g.GameId == game.GameId);

            if (existingRecord != null)
            {
                // Update existing
                existingRecord.CompletedAt = game.CompletedAt;
                existingRecord.WinnerName = game.Winner?.Name;
                existingRecord.TotalThrows = game.Players.Sum(p => p.Throws.Count);

                // Update players
                foreach (var player in game.Players)
                {
                    var playerRecord = existingRecord.Players.FirstOrDefault(p => p.PlayerName == player.Name);
                    if (playerRecord != null)
                    {
                        UpdatePlayerRecord(playerRecord, player, game);
                    }
                }
            }
            else
            {
                // Create new
                var record = new GameRecord
                {
                    GameId = game.GameId,
                    GameType = game.GameType.ToString(),
                    StartedAt = game.StartedAt,
                    CompletedAt = game.CompletedAt,
                    WinnerName = game.Winner?.Name,
                    TotalThrows = game.Players.Sum(p => p.Throws.Count),
                    Players = game.Players.Select(p => CreatePlayerRecord(p, game)).ToList()
                };

                _context.Games.Add(record);
            }

            await _context.SaveChangesAsync();
        }

        private PlayerRecord CreatePlayerRecord(Player player, GameState game)
        {
            var record = new PlayerRecord
            {
                PlayerName = player.Name,
                FinalPosition = player.Position,
                FinalScore = player.Score,
                TotalThrows = player.Throws.Count,
                IsWinner = player.IsWinner,
                ThrowsJson = JsonSerializer.Serialize(player.Throws)
            };

            CalculatePlayerStats(record, player, game);
            return record;
        }

        private void UpdatePlayerRecord(PlayerRecord record, Player player, GameState game)
        {
            record.FinalPosition = player.Position;
            record.FinalScore = player.Score;
            record.TotalThrows = player.Throws.Count;
            record.IsWinner = player.IsWinner;
            record.ThrowsJson = JsonSerializer.Serialize(player.Throws);

            CalculatePlayerStats(record, player, game);
        }

        private void CalculatePlayerStats(PlayerRecord record, Player player, GameState game)
        {
            var throws = player.Throws;

            if (game.GameType == GameType.X01)
            {
                // Calculate 3-dart average
                var totalScore = CalculateTotalScore(throws);
                var turns = (int)Math.Ceiling(throws.Count / 3.0);
                record.ThreeDartAverage = turns > 0 ? (double)totalScore / turns * 3 : 0;

                // Count high scores
                record.OneEighties = CountHighScores(throws, 180, 180);
                record.OneFortiesPlus = CountHighScores(throws, 140, 179);
                record.TonPlus = CountHighScores(throws, 100, 139);

                // Checkout (if winner)
                if (player.IsWinner && throws.Count > 0)
                {
                    record.Checkout = ParseThrowValue(throws.Last());
                }
            }
            else if (game.GameType == GameType.AroundTheClockTurbo)
            {
                // Calculate best streak (would need to track during game)
                // For now we'll leave this for later enhancement
            }
        }

        private int CalculateTotalScore(List<string> throws)
        {
            return throws.Sum(t => ParseThrowValue(t));
        }

        private int ParseThrowValue(string segment)
        {
            if (string.IsNullOrEmpty(segment)) return 0;

            var multiplier = segment[0] switch
            {
                'T' => 3,
                'D' => 2,
                _ => 1
            };

            var valueStr = multiplier > 1 ? segment.Substring(1) : segment.TrimStart('S');
            if (int.TryParse(valueStr, out var value))
            {
                return value * multiplier;
            }

            return 0;
        }

        private int CountHighScores(List<string> throws, int min, int max)
        {
            var count = 0;
            for (int i = 0; i < throws.Count; i += 3)
            {
                var turnThrows = throws.Skip(i).Take(3);
                var turnScore = turnThrows.Sum(t => ParseThrowValue(t));
                if (turnScore >= min && turnScore <= max)
                {
                    count++;
                }
            }
            return count;
        }

        public async Task<List<GameRecord>> GetRecentGamesAsync(int count = 10)
        {
            return await _context.Games
                .Include(g => g.Players)
                .OrderByDescending(g => g.StartedAt)
                .Take(count)
                .ToListAsync();
        }

        public async Task<PlayerStats> GetPlayerStatsAsync(string playerName)
        {
            var playerGames = await _context.PlayerRecords
                .Include(p => p.GameRecord)
                .Where(p => p.PlayerName.ToLower() == playerName.ToLower())
                .OrderByDescending(p => p.GameRecord.StartedAt)
                .ToListAsync();

            var stats = new PlayerStats
            {
                PlayerName = playerName,
                GamesPlayed = playerGames.Count,
                GamesWon = playerGames.Count(p => p.IsWinner),

                // X01 stats
                ThreeDartAverage = playerGames
                    .Where(p => p.ThreeDartAverage.HasValue && p.ThreeDartAverage > 0)
                    .Select(p => p.ThreeDartAverage!.Value)
                    .DefaultIfEmpty(0)
                    .Average(),
                HighestCheckout = playerGames
                    .Where(p => p.Checkout.HasValue)
                    .Select(p => p.Checkout!.Value)
                    .DefaultIfEmpty(0)
                    .Max(),
                TotalCheckouts = playerGames.Count(p => p.Checkout.HasValue && p.Checkout > 0),
                OneEighties = playerGames.Sum(p => p.OneEighties ?? 0),
                OneFortiesPlus = playerGames.Sum(p => p.OneFortiesPlus ?? 0),
                TonPlus = playerGames.Sum(p => p.TonPlus ?? 0),

                // Around the Clock stats
                BestStreak = playerGames
                    .Where(p => p.BestStreak.HasValue)
                    .Select(p => p.BestStreak!.Value)
                    .DefaultIfEmpty(0)
                    .Max(),
                FastestGame = playerGames
                    .Where(p => p.IsWinner)
                    .Select(p => p.TotalThrows)
                    .DefaultIfEmpty(0)
                    .Min(),

                // Recent games
                RecentGames = playerGames.Take(10).Select(p => new GameSummary
                {
                    GameId = p.GameRecord.GameId,
                    GameType = p.GameRecord.GameType,
                    PlayedAt = p.GameRecord.CompletedAt ?? p.GameRecord.StartedAt,
                    Won = p.IsWinner,
                    TotalThrows = p.TotalThrows,
                    ThreeDartAvg = p.ThreeDartAverage,
                    Checkout = p.Checkout
                }).ToList()
            };

            return stats;
        }

        public async Task<List<string>> GetAllPlayerNamesAsync()
        {
            return await _context.PlayerRecords
                .Select(p => p.PlayerName)
                .Distinct()
                .OrderBy(n => n)
                .ToListAsync();
        }
    }
}