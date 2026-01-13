namespace MyDarts.Api.Models.Requests
{
    public class MickeyMouseOptions
    {
        public int LowestNumber { get; set; } = 12;  // 20 down to this number (12, 10, etc.)
        public bool IncludeDoubles { get; set; } = true;
        public bool IncludeTriples { get; set; } = true;
        public bool IncludeBeds { get; set; } = true;
    }
}