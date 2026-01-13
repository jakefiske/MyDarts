using MyDarts.Api.Models.Entities;

namespace MyDarts.Api.Services.Interfaces
{
    public interface IGameRepository
    {
        Task SaveGameAsync(GameState game);
        Task<List<GameRecord>> GetRecentGamesAsync(int count = 10);
        Task<PlayerStats> GetPlayerStatsAsync(string playerName);
        Task<List<string>> GetAllPlayerNamesAsync();
    }
}