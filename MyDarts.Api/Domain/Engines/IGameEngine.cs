using MyDarts.Api.Domain.Events;
using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;

namespace MyDarts.Api.Domain.Engines
{
    public interface IGameEngine
    {
        GameType GameType { get; }
        string DisplayName { get; }
        string Description { get; }

        GameState CreateGame(List<string> playerNames, CreateGameRequest? options = null);
        (GameState game, List<GameEvent> events) ProcessThrow(GameState game, DartThrow dart);
        string GetCurrentTargetDisplay(Player player);
    }
}