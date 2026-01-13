using Microsoft.AspNetCore.Mvc;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;
using MyDarts.Api.Services.Interfaces;
using System.Text;
using System.Text.Json;

namespace MyDarts.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AutodartsController : ControllerBase
    {
        private readonly IGameService _gameService;
        private readonly ILogger<AutodartsController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public AutodartsController(
            IGameService gameService,
            ILogger<AutodartsController> logger,
            IHttpClientFactory httpClientFactory)
        {
            _gameService = gameService;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("auth/login")]
        public async Task<IActionResult> ProxyLogin([FromBody] AutodartsLoginRequest request)
        {
            try
            {
                _logger.LogInformation("Proxying Autodarts Keycloak login request");

                var client = _httpClientFactory.CreateClient();
                
                // Autodarts uses Keycloak for authentication
                var formData = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("client_id", "autodarts-app"),
                    new KeyValuePair<string, string>("grant_type", "password"),
                    new KeyValuePair<string, string>("username", request.Email),
                    new KeyValuePair<string, string>("password", request.Password)
                });

                var response = await client.PostAsync(
                    "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token",
                    formData);
                
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Autodarts login failed: {Status} - {Body}", response.StatusCode, responseBody);
                    return StatusCode((int)response.StatusCode, responseBody);
                }

                _logger.LogInformation("Autodarts login successful");
                
                // Parse the Keycloak response and extract the access token
                var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseBody);
                var accessToken = tokenResponse.GetProperty("access_token").GetString();
                
                return Ok(new { token = accessToken });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error proxying Autodarts login");
                return StatusCode(500, "Failed to connect to Autodarts");
            }
        }

        [HttpPost("throw")]
        public async Task<IActionResult> ReceiveThrow([FromBody] AutodartsThrowWebhook webhook, [FromQuery] string? gameId = null)
        {
            try
            {
                string actualGameId = !string.IsNullOrEmpty(gameId) ? gameId : webhook.GameId;

                _logger.LogInformation("Received Autodarts throw: Game={GameId}, Segment={Segment}, Multiplier={Multiplier}",
                    actualGameId, webhook.Segment, webhook.Multiplier);

                if (string.IsNullOrEmpty(actualGameId))
                {
                    return BadRequest("Game ID is required");
                }

                var game = _gameService.GetGame(actualGameId);
                if (game == null)
                {
                    return NotFound($"Game {actualGameId} not found");
                }

                if (game.Status == GameStatus.Complete)
                {
                    return BadRequest("Game is already complete");
                }

                int value = 0;
                string segment = "";

                if (webhook.Segment == "25")
                {
                    value = webhook.Multiplier == 2 ? 50 : 25;
                    segment = webhook.Multiplier == 2 ? "DB" : "SB";
                }
                else if (webhook.Segment == "0" || string.Equals(webhook.Segment, "MISS", StringComparison.OrdinalIgnoreCase))
                {
                    value = 0;
                    segment = "MISS";
                }
                else if (int.TryParse(webhook.Segment, out int segmentNumber))
                {
                    value = segmentNumber;
                    segment = webhook.Multiplier switch
                    {
                        3 => $"T{segmentNumber}",
                        2 => $"D{segmentNumber}",
                        _ => $"S{segmentNumber}"
                    };
                }
                else
                {
                    return BadRequest($"Invalid segment: {webhook.Segment}");
                }

                var dartThrow = new DartThrow
                {
                    Segment = segment,
                    Value = value,
                    Multiplier = webhook.Multiplier
                };

                var (updatedGame, _) = await _gameService.ProcessThrowAsync(actualGameId, dartThrow);

                return Ok(new
                {
                    success = true,
                    gameId = actualGameId,
                    segment,
                    multiplier = webhook.Multiplier,
                    value,
                    message = $"Throw {segment} recorded successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Autodarts throw");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }
    }

    public class AutodartsLoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AutodartsThrowWebhook
    {
        public string GameId { get; set; } = string.Empty;
        public string Segment { get; set; } = string.Empty;
        public int Multiplier { get; set; }
        public DateTime? Timestamp { get; set; }
        public double? Confidence { get; set; }
    }
}
