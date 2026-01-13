namespace MyDarts.Api.Models.Entities.GameData
{
    public abstract class GameDataBase
    {
        public int SchemaVersion { get; set; } = 1;
        public string GameDataType { get; set; } = string.Empty;

        protected GameDataBase()
        {
            GameDataType = GetType().Name;
        }
    }
}