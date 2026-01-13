using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyDarts.Api.Data;
using MyDarts.Api.Models.Entities;

namespace MyDarts.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayerController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PlayerController> _logger;

        public PlayerController(AppDbContext context, ILogger<PlayerController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/player
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SavedPlayer>>> GetPlayers()
        {
            try
            {
                var players = await _context.SavedPlayers
                    .OrderByDescending(p => p.LastPlayedAt ?? p.CreatedAt)
                    .ToListAsync();

                return Ok(players);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting players");
                return StatusCode(500, "Error retrieving players");
            }
        }

        // GET: api/player/recent?limit=6
        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<SavedPlayer>>> GetRecentPlayers([FromQuery] int limit = 6)
        {
            try
            {
                var players = await _context.SavedPlayers
                    .Where(p => p.LastPlayedAt != null)
                    .OrderByDescending(p => p.LastPlayedAt)
                    .Take(limit)
                    .ToListAsync();

                return Ok(players);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent players");
                return StatusCode(500, "Error retrieving recent players");
            }
        }

        // GET: api/player/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<SavedPlayer>> GetPlayer(int id)
        {
            try
            {
                var player = await _context.SavedPlayers.FindAsync(id);

                if (player == null)
                    return NotFound();

                return Ok(player);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting player {Id}", id);
                return StatusCode(500, "Error retrieving player");
            }
        }

        // POST: api/player
        [HttpPost]
        public async Task<ActionResult<SavedPlayer>> CreatePlayer([FromBody] CreatePlayerRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                    return BadRequest("Player name is required");

                // Check if player with same name already exists
                var existing = await _context.SavedPlayers
                    .FirstOrDefaultAsync(p => p.Name.ToLower() == request.Name.ToLower());

                if (existing != null)
                    return Conflict("A player with this name already exists");

                var player = new SavedPlayer
                {
                    Name = request.Name.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    PreferredGameType = request.PreferredGameType,
                    Notes = request.Notes
                };

                _context.SavedPlayers.Add(player);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPlayer), new { id = player.Id }, player);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating player");
                return StatusCode(500, "Error creating player");
            }
        }

        // PUT: api/player/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlayer(int id, [FromBody] UpdatePlayerRequest request)
        {
            try
            {
                var player = await _context.SavedPlayers.FindAsync(id);

                if (player == null)
                    return NotFound();

                if (!string.IsNullOrWhiteSpace(request.Name))
                {
                    // Check if another player has this name
                    var existing = await _context.SavedPlayers
                        .FirstOrDefaultAsync(p => p.Id != id && p.Name.ToLower() == request.Name.ToLower());

                    if (existing != null)
                        return Conflict("Another player with this name already exists");

                    player.Name = request.Name.Trim();
                }

                if (request.PreferredGameType.HasValue)
                    player.PreferredGameType = request.PreferredGameType;

                if (request.Notes != null)
                    player.Notes = request.Notes;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating player {Id}", id);
                return StatusCode(500, "Error updating player");
            }
        }

        // DELETE: api/player/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlayer(int id)
        {
            try
            {
                var player = await _context.SavedPlayers.FindAsync(id);

                if (player == null)
                    return NotFound();

                _context.SavedPlayers.Remove(player);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting player {Id}", id);
                return StatusCode(500, "Error deleting player");
            }
        }

        // POST: api/player/track-usage
        [HttpPost("track-usage")]
        public async Task<IActionResult> TrackPlayerUsage([FromBody] TrackUsageRequest request)
        {
            try
            {
                if (request.PlayerNames == null || !request.PlayerNames.Any())
                    return BadRequest("Player names required");

                var now = DateTime.UtcNow;

                foreach (var name in request.PlayerNames)
                {
                    var player = await _context.SavedPlayers
                        .FirstOrDefaultAsync(p => p.Name.ToLower() == name.ToLower());

                    if (player != null)
                    {
                        player.GamesPlayed++;
                        player.LastPlayedAt = now;
                    }
                }

                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking player usage");
                return StatusCode(500, "Error tracking usage");
            }
        }
    }

    public class CreatePlayerRequest
    {
        public string Name { get; set; } = string.Empty;
        public int? PreferredGameType { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdatePlayerRequest
    {
        public string? Name { get; set; }
        public int? PreferredGameType { get; set; }
        public string? Notes { get; set; }
    }

    public class TrackUsageRequest
    {
        public List<string> PlayerNames { get; set; } = new();
    }
}