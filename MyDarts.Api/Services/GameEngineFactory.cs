using MyDarts.Api.Domain.Engines;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Services.Interfaces;

namespace MyDarts.Api.Services
{
    public class GameEngineFactory : IGameEngineFactory
    {
        private readonly Dictionary<GameType, IGameEngine> _engines;

        public GameEngineFactory(IEnumerable<IGameEngine> engines)
        {
            _engines = engines.ToDictionary(e => e.GameType);
        }

        public IGameEngine GetEngine(GameType gameType)
        {
            if (!_engines.TryGetValue(gameType, out var engine))
                throw new ArgumentException($"No engine registered for game type: {gameType}");

            return engine;
        }

        public IEnumerable<GameTypeInfo> GetAvailableGameTypes()
        {
            return _engines.Values.Select(e => new GameTypeInfo
            {
                GameType = e.GameType,
                DisplayName = e.DisplayName,
                Description = e.Description
            });
        }
    }

    public class GameTypeInfo
    {
        public GameType GameType { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}