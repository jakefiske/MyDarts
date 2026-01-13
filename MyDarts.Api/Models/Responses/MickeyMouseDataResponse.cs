using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using System.Text.Json;

namespace MyDarts.Api.Models.Responses
{
    public class MickeyMouseDataResponse
    {
        public Dictionary<int, int> NumberMarks { get; set; } = new();
        public int DoublesMarks { get; set; }
        public int TriplesMarks { get; set; }
        public int BedsMarks { get; set; }
        public int BullMarks { get; set; }
    }
}