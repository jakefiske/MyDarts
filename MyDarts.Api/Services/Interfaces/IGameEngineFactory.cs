using MyDarts.Api.Domain.Engines;
using MyDarts.Api.Models.Enums;

namespace MyDarts.Api.Services.Interfaces
{
    public interface IGameEngineFactory
    {
        IGameEngine GetEngine(GameType gameType);
        IEnumerable<GameTypeInfo> GetAvailableGameTypes();
    }
}