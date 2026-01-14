using MyDarts.Api.Models.Enums;

namespace MyDarts.Api.Models.Requests
{
    public class DartThrow
    {
        private string? _segment;

        public string? Segment
        {
            get => _segment ?? CalculateSegment();
            set => _segment = value;
        }

        public int Value { get; set; }
        public int Multiplier { get; set; }
        public bool IsShanghaiReplay { get; set; }
        // Mickey Mouse: Optional allocation choice
        public AllocationChoice? AllocationChoice { get; set; }

        // Fallback calculation if segment not provided (backward compatibility)
        private string CalculateSegment()
        {
            if (Value == 0) return "MISS";
            if (Value == 25) return "SB";
            if (Value == 50) return "DB";

            // Value is the segment number (1-20), not total points
            return Multiplier switch
            {
                3 => $"T{Value}",
                2 => $"D{Value}",
                _ => $"S{Value}"
            };
        }
    }
}