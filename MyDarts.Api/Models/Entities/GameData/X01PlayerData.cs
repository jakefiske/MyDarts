namespace MyDarts.Api.Models.Entities.GameData
{
    public class X01PlayerData : GameDataBase
    {
        // Schema version history:
        // v1: Initial release - StartingScore, DoubleInRequired, HasDoubledIn, TurnStartScore

        public new int SchemaVersion { get; set; } = 1;

        public int StartingScore { get; set; } = 501;
        public bool DoubleInRequired { get; set; } = false;
        public bool HasDoubledIn { get; set; } = true;
        public int TurnStartScore { get; set; }

        // Future fields go here with defaults so old data still works
        // v2 example: public bool DoubleOutRequired { get; set; } = true;

        public static X01PlayerData Migrate(X01PlayerData old)
        {
            // Handle migrations between versions
            // if (old.SchemaVersion < 2) { /* migrate v1 to v2 */ }
            return old;
        }
    }
}