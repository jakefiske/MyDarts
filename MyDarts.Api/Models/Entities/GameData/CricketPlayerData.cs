namespace MyDarts.Api.Models.Entities.GameData
{
    public class CricketPlayerData : GameDataBase
    {
        // Track marks for each number (15-20 and Bull)
        // 0 = no marks, 1 = one mark (/), 2 = two marks (X), 3+ = closed (⭕) + scoring
        public Dictionary<int, int> Marks { get; set; } = new()
        {
            { 15, 0 },
            { 16, 0 },
            { 17, 0 },
            { 18, 0 },
            { 19, 0 },
            { 20, 0 },
            { 25, 0 }  // Bull
        };

        // Total score accumulated
        public int Score { get; set; } = 0;

        // Check if all numbers are closed
        public bool AllNumbersClosed()
        {
            return Marks.Values.All(marks => marks >= 3);
        }

        // Check if a specific number is closed
        public bool IsNumberClosed(int number)
        {
            return Marks.ContainsKey(number) && Marks[number] >= 3;
        }

        // Get number of marks for a number
        public int GetMarks(int number)
        {
            return Marks.ContainsKey(number) ? Marks[number] : 0;
        }
    }
}