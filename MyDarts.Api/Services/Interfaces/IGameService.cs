using MyDarts.Api.Domain.Events;
using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;

namespace MyDarts.Api.Services.Interfaces
{
    public interface IGameService
    {
        Task<(GameState game, List<GameEvent> events)> CreateGameAsync(GameType gameType, List<string> playerNames, CreateGameRequest? options = null);
        GameState? GetGame(string gameId);
        Task<(GameState game, List<GameEvent> events)> ProcessThrowAsync(string gameId, DartThrow dart);
        Task<(GameState game, List<GameEvent> events)> EditThrowAsync(string gameId, int throwIndex, DartThrow dart);
        Task<(GameState game, List<GameEvent> events)> ConfirmTurnAsync(string gameId, ConfirmTurnRequest? request = null);
        GameState? UndoLastThrow(string gameId);
        IEnumerable<GameTypeInfo> GetAvailableGameTypes();
    }
}