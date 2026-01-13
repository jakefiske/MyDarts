using Microsoft.AspNetCore.Mvc;
using MyDarts.Api.Domain.Engines;
using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;
using MyDarts.Api.Models.Responses;
using MyDarts.Api.Services;
using MyDarts.Api.Services.Interfaces;

namespace MyDarts.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        private readonly IGameService _gameService;
        private readonly IGameRepository _repository;
        private readonly IGameEngineFactory _engineFactory;

        public GameController(IGameService gameService, IGameRepository repository, IGameEngineFactory engineFactory)
        {
            _gameService = gameService;
            _repository = repository;
            _engineFactory = engineFactory;
        }

        private GameResponse BuildResponse(GameState game)
        {
            var engine = _engineFactory.GetEngine(game.GameType);

            Func<Player, string?>? getCheckout = null;
            Func<Player, bool>? getRequiresDoubleIn = null;

            if (engine is X01Engine x01Engine)
            {
                getCheckout = x01Engine.GetCheckoutSuggestion;
                getRequiresDoubleIn = x01Engine.RequiresDoubleIn;
            }

            return GameResponse.FromGameState(game, engine.GetCurrentTargetDisplay, getCheckout, getRequiresDoubleIn);
        }

        [HttpGet("types")]
        public ActionResult<IEnumerable<GameTypeInfo>> GetGameTypes()
        {
            return Ok(_gameService.GetAvailableGameTypes());
        }

        [HttpPost("new")]
        public async Task<ActionResult<GameResponse>> NewGame([FromBody] CreateGameRequest request)
        {
            var gameType = request.GameType ?? GameType.AroundTheClockTurbo;
            var playerNames = request.PlayerNames ?? new List<string> { "Player 1" };

            var (game, _) = await _gameService.CreateGameAsync(gameType, playerNames, request);
            return Ok(BuildResponse(game));
        }

        [HttpGet("{gameId}")]
        public ActionResult<GameResponse> GetGame(string gameId)
        {
            var game = _gameService.GetGame(gameId);
            if (game == null) return NotFound();

            return Ok(BuildResponse(game));
        }

        [HttpPost("{gameId}/throw")]
        public async Task<ActionResult<GameResponse>> Throw(string gameId, [FromBody] DartThrow dart)
        {
            try
            {
                var (game, _) = await _gameService.ProcessThrowAsync(gameId, dart);
                return Ok(BuildResponse(game));
            }
            catch (InvalidOperationException)
            {
                return NotFound();
            }
        }

        [HttpPost("{gameId}/throw/{throwIndex}")]
        public async Task<ActionResult<GameResponse>> EditThrow(string gameId, int throwIndex, [FromBody] DartThrow dart)
        {
            try
            {
                var (game, _) = await _gameService.EditThrowAsync(gameId, throwIndex, dart);
                return Ok(BuildResponse(game));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{gameId}/undo")]
        public ActionResult<GameResponse> Undo(string gameId)
        {
            var game = _gameService.UndoLastThrow(gameId);
            if (game == null) return BadRequest("No moves to undo");

            return Ok(BuildResponse(game));
        }

        [HttpPost("{gameId}/confirm-turn")]
        public async Task<ActionResult<GameResponse>> ConfirmTurn(string gameId, [FromBody] ConfirmTurnRequest? request = null)
        {
            try
            {
                var (game, _) = await _gameService.ConfirmTurnAsync(gameId, request);
                return Ok(BuildResponse(game));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("history")]
        public async Task<ActionResult<List<GameRecord>>> GetHistory([FromQuery] int count = 10)
        {
            var games = await _repository.GetRecentGamesAsync(count);
            return Ok(games);
        }

        [HttpGet("stats/{playerName}")]
        public async Task<ActionResult<PlayerStats>> GetPlayerStats(string playerName)
        {
            var stats = await _repository.GetPlayerStatsAsync(playerName);
            return Ok(stats);
        }

        [HttpGet("players")]
        public async Task<ActionResult<List<string>>> GetAllPlayers()
        {
            var players = await _repository.GetAllPlayerNamesAsync();
            return Ok(players);
        }
    }
}