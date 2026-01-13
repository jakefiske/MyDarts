using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using System.Text.Json;

namespace MyDarts.Api.Models.Responses
{
    public class ThrowResponse
    {
        public int ThrowNumber { get; set; }
        public string Segment { get; set; } = string.Empty;
        public int Value { get; set; }
        public int Multiplier { get; set; }
        public bool IsHit { get; set; }

        public static ThrowResponse FromSegment(string segment, int throwNumber)
        {
            int multiplier;
            int value;

            // Handle special cases
            if (segment == "MISS")
            {
                multiplier = 0;
                value = 0;
            }
            else if (segment == "SB")
            {
                multiplier = 1;
                value = 25;
            }
            else if (segment == "DB")
            {
                multiplier = 2;
                value = 50;
            }
            else
            {
                // Standard format: T8, D20, S16, or just 8, 20, 16
                multiplier = segment[0] switch
                {
                    'T' => 3,
                    'D' => 2,
                    'S' => 1,
                    _ => 1
                };

                var valueStr = (segment[0] == 'T' || segment[0] == 'D' || segment[0] == 'S')
                    ? segment.Substring(1)
                    : segment;

                // Parse the BASE value (don't multiply again!)
                var baseValue = int.TryParse(valueStr, out var v) ? v : 0;
                value = baseValue;  // Store base value, not calculated score
            }

            return new ThrowResponse
            {
                ThrowNumber = throwNumber,
                Segment = segment,
                Value = value,
                Multiplier = multiplier,
                IsHit = value > 0
            };
        }
    }
}