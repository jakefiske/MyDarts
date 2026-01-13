namespace MyDarts.Api.Models.Entities.GameData
{
    public class X01GameSettings : GameDataBase
    {
        public new int SchemaVersion { get; set; } = 1;

        public int StartingScore { get; set; } = 501;
        public bool DoubleInRequired { get; set; } = false;
        public bool DoubleOutRequired { get; set; } = true;

        // Future: sets to win, legs per set, etc.
    }
}