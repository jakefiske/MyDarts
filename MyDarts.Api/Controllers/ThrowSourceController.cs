using Microsoft.AspNetCore.Mvc;
using MyDarts.Api.Services.ThrowSources;

namespace MyDarts.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThrowSourceController : ControllerBase
    {
        private readonly IThrowSourceManager _throwSourceManager;
        private readonly ILogger<ThrowSourceController> _logger;

        public ThrowSourceController(
            IThrowSourceManager throwSourceManager,
            ILogger<ThrowSourceController> logger)
        {
            _throwSourceManager = throwSourceManager;
            _logger = logger;
        }

        /// <summary>
        /// Get all available throw sources
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSources()
        {
            var sources = new List<object>();

            foreach (var source in _throwSourceManager.AvailableSources)
            {
                var available = await source.IsAvailableAsync();
                sources.Add(new
                {
                    sourceId = source.SourceId,
                    displayName = source.DisplayName,
                    status = source.Status.ToString(),
                    isActive = _throwSourceManager.ActiveSource?.SourceId == source.SourceId,
                    isAvailable = available
                });
            }

            return Ok(new
            {
                sources,
                activeSourceId = _throwSourceManager.ActiveSource?.SourceId,
                boundGameId = _throwSourceManager.BoundGameId
            });
        }

        /// <summary>
        /// Get a specific throw source
        /// </summary>
        [HttpGet("{sourceId}")]
        public async Task<IActionResult> GetSource(string sourceId)
        {
            var source = _throwSourceManager.GetSource(sourceId);
            if (source == null)
                return NotFound(new { error = $"Source '{sourceId}' not found" });

            return Ok(new
            {
                sourceId = source.SourceId,
                displayName = source.DisplayName,
                status = source.Status.ToString(),
                isActive = _throwSourceManager.ActiveSource?.SourceId == sourceId,
                isAvailable = await source.IsAvailableAsync()
            });
        }

        /// <summary>
        /// Activate a throw source
        /// </summary>
        [HttpPost("{sourceId}/activate")]
        public async Task<IActionResult> ActivateSource(string sourceId)
        {
            try
            {
                await _throwSourceManager.ActivateSourceAsync(sourceId);
                return Ok(new
                {
                    message = $"Source '{sourceId}' activated",
                    sourceId,
                    status = _throwSourceManager.ActiveSource?.Status.ToString()
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to activate source {SourceId}", sourceId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Deactivate the current throw source
        /// </summary>
        [HttpPost("deactivate")]
        public async Task<IActionResult> Deactivate()
        {
            await _throwSourceManager.DeactivateAsync();
            return Ok(new { message = "Throw source deactivated" });
        }

        /// <summary>
        /// Bind throw source to a game
        /// </summary>
        [HttpPost("bind/{gameId}")]
        public IActionResult BindToGame(string gameId)
        {
            if (_throwSourceManager.ActiveSource == null)
                return BadRequest(new { error = "No active throw source" });

            _throwSourceManager.BindToGame(gameId);
            return Ok(new
            {
                message = $"Bound to game {gameId}",
                gameId,
                sourceId = _throwSourceManager.ActiveSource.SourceId
            });
        }

        /// <summary>
        /// Unbind throw source from current game
        /// </summary>
        [HttpPost("unbind")]
        public IActionResult Unbind()
        {
            var oldGameId = _throwSourceManager.BoundGameId;
            _throwSourceManager.Unbind();
            return Ok(new
            {
                message = "Unbound from game",
                previousGameId = oldGameId
            });
        }

        /// <summary>
        /// Get current status
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            var autodartsSource = _throwSourceManager.GetSource("autodarts") as AutodartsThrowSource;

            return Ok(new
            {
                activeSource = _throwSourceManager.ActiveSource == null ? null : new
                {
                    sourceId = _throwSourceManager.ActiveSource.SourceId,
                    displayName = _throwSourceManager.ActiveSource.DisplayName,
                    status = _throwSourceManager.ActiveSource.Status.ToString()
                },
                boundGameId = _throwSourceManager.BoundGameId,
                dartsCallerUrl = autodartsSource?.CurrentUrl
            });
        }

        /// <summary>
        /// Configure the Autodarts/darts-caller URL
        /// </summary>
        [HttpPost("autodarts/configure")]
        public IActionResult ConfigureAutodarts([FromBody] AutodartsConfigRequest request)
        {
            var source = _throwSourceManager.GetSource("autodarts") as AutodartsThrowSource;
            if (source == null)
                return NotFound(new { error = "Autodarts source not found" });

            if (string.IsNullOrWhiteSpace(request.Url))
                return BadRequest(new { error = "URL is required" });

            source.SetUrl(request.Url);

            return Ok(new
            {
                message = "Autodarts URL configured",
                url = source.CurrentUrl
            });
        }

        /// <summary>
        /// Get Autodarts configuration
        /// </summary>
        [HttpGet("autodarts/config")]
        public IActionResult GetAutodartsConfig()
        {
            var source = _throwSourceManager.GetSource("autodarts") as AutodartsThrowSource;
            if (source == null)
                return NotFound(new { error = "Autodarts source not found" });

            return Ok(new
            {
                url = source.CurrentUrl,
                status = source.Status.ToString()
            });
        }
    }

    public class AutodartsConfigRequest
    {
        public string Url { get; set; } = "";
    }
}