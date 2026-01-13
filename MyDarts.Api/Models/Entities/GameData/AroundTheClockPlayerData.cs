namespace MyDarts.Api.Models.Entities.GameData
{
    public class AroundTheClockPlayerData : GameDataBase
    {
        public new int SchemaVersion { get; set; } = 1;

        public int CurrentTarget { get; set; } = 1;
        public int TurnStartPosition { get; set; } = 1;

        public static AroundTheClockPlayerData Migrate(AroundTheClockPlayerData old)
        {
            return old;
        }
    }
}