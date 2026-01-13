using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Enums;

namespace MyDarts.Api.Models.Requests
{
    public class ConfirmTurnRequest
    {
        // For beds: allocation choice (either "Number", "Beds", or "Single,Double,Triple" for custom)
        public string? BedAllocation { get; set; }

        // For shanghai: comma-separated allocations for S,D,T (e.g., "Number,Doubles,Triples")
        public string? ShanghaiAllocation { get; set; }
    }
}