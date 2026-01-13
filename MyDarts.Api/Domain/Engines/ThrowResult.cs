namespace MyDarts.Api.Domain.Engines
{
    public class ThrowResult
    {
        public bool WasHit { get; set; }
        public int PositionAdvance { get; set; }
        public string? Message { get; set; }
    }
}