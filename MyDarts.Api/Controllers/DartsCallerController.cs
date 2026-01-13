using Microsoft.AspNetCore.Mvc;
using MyDarts.Api.Services;

namespace MyDarts.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DartsCallerController : ControllerBase
    {
        private readonly IDartsCallerService _dartsCallerService;
        private readonly ILogger<DartsCallerController> _logger;

        public DartsCallerController(
            IDartsCallerService dartsCallerService,
            ILogger<DartsCallerController> logger)
        {
            _dartsCallerService = dartsCallerService;
            _logger = logger;
        }

        /// <summary>
        /// Connect to darts-caller Socket.IO server
        /// </summary>
        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromBody] ConnectRequest request)
        {
            try
            {
                _logger.LogInformation("Connecting to darts-caller at {Url}", request.Url);
                await _dartsCallerService.ConnectAsync(request.Url);
                return Ok(new { success = true, message = "Connected to darts-caller" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to darts-caller");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Disconnect from darts-caller
        /// </summary>
        [HttpPost("disconnect")]
        public async Task<IActionResult> Disconnect()
        {
            try
            {
                await _dartsCallerService.DisconnectAsync();
                return Ok(new { success = true, message = "Disconnected from darts-caller" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to disconnect from darts-caller");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get current connection status
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new
            {
                connected = _dartsCallerService.IsConnected,
                url = _dartsCallerService.CurrentUrl
            });
        }
    }

    public class ConnectRequest
    {
        public string Url { get; set; } = "https://localhost:8079";
    }
}
