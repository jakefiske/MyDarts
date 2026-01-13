using System.Text.Json.Serialization;

namespace MyDarts.Api.Models.Enums
{
    public enum GameType
    {
        AroundTheClockTurbo,
        X01,
        Cricket,
        MickeyMouse
    }

    public enum GameStatus
    {
        WaitingForPlayers,
        InProgress,
        Complete
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum AllocationChoice
    {
        Number = 0,
        Doubles = 1,
        Triples = 2,
        Beds = 3,
        Skip = 4
    }
}