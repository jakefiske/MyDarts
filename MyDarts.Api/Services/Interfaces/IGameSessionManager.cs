using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;

namespace MyDarts.Api.Services.Interfaces
{
    public interface IGameSessionManager
    {
        void AddGame(GameState game);
        GameState? GetGame(string gameId);
        IEnumerable<GameState> GetActiveGames();
        void UpdateGame(GameState game);
        void RemoveGame(string gameId);
        void SaveSnapshot(string gameId, GameStateSnapshot snapshot);
        GameStateSnapshot? PopSnapshot(string gameId);
        bool HasSnapshots(string gameId);
    }
}