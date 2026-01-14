using Xunit;
using Moq;
using MyDarts.Api.Services;
using MyDarts.Api.Services.Interfaces;
using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;
using MyDarts.Api.Domain.Engines;
using MyDarts.Api.Domain.Events;
using MyDarts.Api.Models.Entities.GameData;

namespace MyDarts.Tests
{
    public class BedAllocationTests
    {
        private readonly GameService _gameService;
        private readonly Mock<IGameRepository> _mockRepository;
        private readonly Mock<IEventDispatcher> _mockEventDispatcher;
        private readonly IGameSessionManager _sessionManager;
        private readonly IGameEngineFactory _engineFactory;

        public BedAllocationTests()
        {
            // Use real implementations for core logic
            _sessionManager = new InMemoryGameSessionManager();
            _engineFactory = new GameEngineFactory(new List<IGameEngine>
            {
                new MickeyMouseEngine()
            });

            // Mock only external dependencies
            _mockRepository = new Mock<IGameRepository>();
            _mockRepository.Setup(r => r.SaveGameAsync(It.IsAny<GameState>())).Returns(Task.CompletedTask);

            _mockEventDispatcher = new Mock<IEventDispatcher>();
            _mockEventDispatcher.Setup(e => e.DispatchAsync(It.IsAny<List<GameEvent>>())).Returns(Task.CompletedTask);

            _gameService = new GameService(_engineFactory, _sessionManager, _mockRepository.Object, _mockEventDispatcher.Object);
        }

        [Fact]
        public async Task TwoConsecutiveBeds_ShouldScoreCorrectly()
        {
            // Arrange
            var playerNames = new List<string> { "Jake", "Test" };
            var options = new CreateGameRequest
            {
                MickeyMouseOptions = new MickeyMouseOptions
                {
                    LowestNumber = 15,
                    IncludeDoubles = false,
                    IncludeTriples = false,
                    IncludeBeds = true
                }
            };

            var (game, _) = await _gameService.CreateGameAsync(GameType.MickeyMouse, playerNames, options);
            var gameId = game.GameId;

            // Act - Jake's first bed (3x S20)
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });

            // Confirm bed allocation - mark on number
            var (game1, _) = await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Number" });

            var jakeAfterFirstBed = game1.Players[0];
            var jakeData1 = jakeAfterFirstBed.GetGameData<MickeyMousePlayerData>();

            // Assert after first bed
            Assert.Equal(3, jakeData1.GetNumberMarks(20)); // 3 marks on 20
            Assert.Equal(0, jakeAfterFirstBed.Score); // No score yet (not closed)

            // Test throws S20, S19, S19 (gets 1 mark on 20)
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            var (game2, _) = await _gameService.ConfirmTurnAsync(gameId);

            var testAfterTurn = game2.Players[1];
            var testData = testAfterTurn.GetGameData<MickeyMousePlayerData>();
            Assert.Equal(1, testData.GetNumberMarks(20)); // Test has 1 mark on 20

            // Jake's second bed (3x S20 again)
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });

            // Confirm second bed allocation - mark on number
            var (game3, _) = await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Number" });

            var jakeAfterSecondBed = game3.Players[0];
            var jakeData2 = jakeAfterSecondBed.GetGameData<MickeyMousePlayerData>();

            // Assert after second bed - THIS IS THE KEY TEST
            Assert.Equal(6, jakeData2.GetNumberMarks(20)); // Should have 6 marks total

            // EXPECTED SCORING when Test has 1 mark on 20:
            // First bed: 3 marks, no score (Test has 0 marks, Jake not closed yet)
            // Test's turn: gets 1 mark on 20
            // Second bed:
            //   - Throw 1 (4th mark): Jake now closed (3 marks), Test has 1, score = (4-3)*20 = 20 points
            //   - Throw 2 (5th mark): (5-3)*20 = 40 points
            //   - Throw 3 (6th mark): (6-3)*20 = 60 points
            //   Total: 20 + 40 + 60 = 120 points
            // At the end, before the assertion that fails:
            // This will show in the test failure message
            Assert.Equal(60, jakeAfterSecondBed.Score); // Will fail and show console output
        }

        [Fact]
        public async Task SingleBed_ShouldScoreZero()
        {
            // Arrange
            var playerNames = new List<string> { "Jake", "Test" };
            var options = new CreateGameRequest
            {
                MickeyMouseOptions = new MickeyMouseOptions
                {
                    LowestNumber = 15,
                    IncludeDoubles = false,
                    IncludeTriples = false,
                    IncludeBeds = true
                }
            };

            var (game, _) = await _gameService.CreateGameAsync(GameType.MickeyMouse, playerNames, options);
            var gameId = game.GameId;

            // Act - Jake's first bed (3x S20)
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });

            // Confirm bed allocation - mark on number
            var (finalGame, _) = await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Number" });

            var jake = finalGame.Players[0];
            var jakeData = jake.GetGameData<MickeyMousePlayerData>();

            // Assert - first bed should give 3 marks but no score
            Assert.Equal(3, jakeData.GetNumberMarks(20));
            Assert.Equal(0, jake.Score); // Not closed yet, no opponent has marks
        }
    }
}