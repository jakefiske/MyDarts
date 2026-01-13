using System.Text.Json;
using MyDarts.Api.Models.Entities.GameData;

namespace MyDarts.Api.Models.Entities
{
    public class Player
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public int Position { get; set; } = 0;
        public int Score { get; set; } = 0;
        public List<string> Throws { get; set; } = new();
        public bool IsWinner { get; set; } = false;

        // Stores serialized game-specific data
        public string? GameDataJson { get; set; }

        // Runtime cache - not persisted
        private object? _gameDataCache;

        public T? GetGameData<T>() where T : GameDataBase
        {
            if (_gameDataCache is T cached)
                return cached;

            if (string.IsNullOrEmpty(GameDataJson))
                return null;

            try
            {
                var data = JsonSerializer.Deserialize<T>(GameDataJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (data != null)
                {
                    // Run migrations if needed
                    data = MigrateIfNeeded(data);
                    _gameDataCache = data;
                }

                return data;
            }
            catch
            {
                return null;
            }
        }

        public void SetGameData<T>(T data) where T : GameDataBase
        {
            _gameDataCache = data;
            GameDataJson = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            });
        }

        private T MigrateIfNeeded<T>(T data) where T : GameDataBase
        {
            // Call the appropriate migration method based on type
            if (data is X01PlayerData x01Data)
                return (T)(object)X01PlayerData.Migrate(x01Data);

            if (data is AroundTheClockPlayerData atcData)
                return (T)(object)AroundTheClockPlayerData.Migrate(atcData);

            return data;
        }
    }
}