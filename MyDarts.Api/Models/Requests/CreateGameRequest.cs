using MyDarts.Api.Models.Enums;

namespace MyDarts.Api.Models.Requests
{
    public class CreateGameRequest
    {
        public GameType? GameType { get; set; }
        public List<string>? PlayerNames { get; set; }

        // X01 options
        public int? StartingScore { get; set; }
        public bool? DoubleIn { get; set; }

        // Mickey Mouse options
        public MickeyMouseOptions? MickeyMouseOptions { get; set; }
    }
}