using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Services.Interfaces;

namespace MyDarts.Api.Services
{
    public class InMemoryGameSessionManager : IGameSessionManager
    {
        private readonly Dictionary<string, GameState> _activeGames = new();
        private readonly Dictionary<string, Stack<GameStateSnapshot>> _snapshots = new();
        private readonly Dictionary<string, DateTime> _completedGameExpiry = new();
        private readonly object _lock = new();
        private readonly TimeSpan _completedGameRetention = TimeSpan.FromMinutes(5);

        public void AddGame(GameState game)
        {
            lock (_lock)
            {
                _activeGames[game.GameId] = game;
                _snapshots[game.GameId] = new Stack<GameStateSnapshot>();
            }
        }

        public GameState? GetGame(string gameId)
        {
            lock (_lock)
            {
                // Clean up expired games first
                CleanupExpiredGames();

                return _activeGames.TryGetValue(gameId, out var game) ? game : null;
            }
        }

        public IEnumerable<GameState> GetActiveGames()
        {
            lock (_lock)
            {
                CleanupExpiredGames();
                return _activeGames.Values
                    .Where(g => g.Status != GameStatus.Complete)
                    .ToList();
            }
        }

        public void UpdateGame(GameState game)
        {
            lock (_lock)
            {
                _activeGames[game.GameId] = game;

                // If game just completed, mark expiry time
                if (game.Status == GameStatus.Complete && !_completedGameExpiry.ContainsKey(game.GameId))
                {
                    _completedGameExpiry[game.GameId] = DateTime.UtcNow.Add(_completedGameRetention);
                }
            }
        }

        public void RemoveGame(string gameId)
        {
            lock (_lock)
            {
                _activeGames.Remove(gameId);
                _snapshots.Remove(gameId);
                _completedGameExpiry.Remove(gameId);
            }
        }

        private void CleanupExpiredGames()
        {
            var now = DateTime.UtcNow;
            var expiredGames = _completedGameExpiry
                .Where(kvp => kvp.Value <= now)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var gameId in expiredGames)
            {
                RemoveGame(gameId);
            }
        }

        public void SaveSnapshot(string gameId, GameStateSnapshot snapshot)
        {
            lock (_lock)
            {
                if (!_snapshots.ContainsKey(gameId))
                    _snapshots[gameId] = new Stack<GameStateSnapshot>();

                _snapshots[gameId].Push(snapshot);
            }
        }

        public GameStateSnapshot? PopSnapshot(string gameId)
        {
            lock (_lock)
            {
                if (_snapshots.TryGetValue(gameId, out var stack) && stack.Count > 0)
                    return stack.Pop();
                return null;
            }
        }

        public bool HasSnapshots(string gameId)
        {
            lock (_lock)
            {
                return _snapshots.TryGetValue(gameId, out var stack) && stack.Count > 0;
            }
        }
    }
}