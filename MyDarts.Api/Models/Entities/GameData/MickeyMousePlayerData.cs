using MyDarts.Api.Models.Enums;

namespace MyDarts.Api.Models.Entities.GameData
{
    public class MickeyMousePlayerData : GameDataBase
    {
        // Track marks for numbers (configurable range, e.g., 20-12 or 20-10)
        public Dictionary<int, int> NumberMarks { get; set; } = new();

        // Track marks for categories
        public int DoublesMarks { get; set; } = 0;
        public int TriplesMarks { get; set; } = 0;
        public int BedsMarks { get; set; } = 0;
        public int BullMarks { get; set; } = 0;

        // Total score accumulated
        public int Score { get; set; } = 0;

        // Track allocation choices for each throw in the turn (for replay during edit)
        public List<AllocationChoice> TurnAllocations { get; set; } = new();

        // Shanghai tracking
        public bool HasShanghaiThisTurn { get; set; } = false;
        public int ShanghaiNumber { get; set; } = 0;

        // Check if all categories are closed
        public bool AllClosed(List<int> numbers, bool includeDoubles, bool includeTriples, bool includeBeds)
        {
            foreach (var num in numbers)
            {
                if (!NumberMarks.ContainsKey(num) || NumberMarks[num] < 3)
                    return false;
            }

            if (BullMarks < 3) return false;

            if (includeDoubles && DoublesMarks < 3) return false;
            if (includeTriples && TriplesMarks < 3) return false;
            if (includeBeds && BedsMarks < 3) return false;

            return true;
        }

        public bool IsNumberClosed(int number)
        {
            return NumberMarks.ContainsKey(number) && NumberMarks[number] >= 3;
        }

        public bool IsCategoryClosed(string category)
        {
            return category switch
            {
                "Doubles" => DoublesMarks >= 3,
                "Triples" => TriplesMarks >= 3,
                "Beds" => BedsMarks >= 3,
                "Bull" => BullMarks >= 3,
                _ => false
            };
        }

        public int GetNumberMarks(int number)
        {
            return NumberMarks.ContainsKey(number) ? NumberMarks[number] : 0;
        }
    }
}