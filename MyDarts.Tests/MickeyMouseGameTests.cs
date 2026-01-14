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

namespace MyDarts.Tests.Games
{
    public class MickeyMouseGameTests
    {
        private readonly GameService _gameService;
        private readonly Mock<IGameRepository> _mockRepository;
        private readonly Mock<IEventDispatcher> _mockEventDispatcher;

        public MickeyMouseGameTests()
        {
            var sessionManager = new InMemoryGameSessionManager();
            var engineFactory = new GameEngineFactory(new List<IGameEngine> { new MickeyMouseEngine() });

            _mockRepository = new Mock<IGameRepository>();
            _mockRepository.Setup(r => r.SaveGameAsync(It.IsAny<GameState>())).Returns(Task.CompletedTask);

            _mockEventDispatcher = new Mock<IEventDispatcher>();
            _mockEventDispatcher.Setup(e => e.DispatchAsync(It.IsAny<List<GameEvent>>())).Returns(Task.CompletedTask);

            _gameService = new GameService(engineFactory, sessionManager, _mockRepository.Object, _mockEventDispatcher.Object);
        }

        private async Task<string> CreateStandardGame()
        {
            var playerNames = new List<string> { "Player1", "Player2" };
            var options = new CreateGameRequest
            {
                MickeyMouseOptions = new MickeyMouseOptions
                {
                    LowestNumber = 15,
                    IncludeDoubles = true,
                    IncludeTriples = true,
                    IncludeBeds = true
                }
            };

            var (game, _) = await _gameService.CreateGameAsync(GameType.MickeyMouse, playerNames, options);
            return game.GameId;
        }

        #region Basic Scoring Tests

        [Fact]
        public async Task SingleMark_ShouldNotScore()
        {
            var gameId = await CreateStandardGame();

            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId);

            var player1 = game.Players[0];
            Assert.Equal(0, player1.Score);
        }

        [Fact]
        public async Task ClosingNumber_ShouldNotScoreUntilOpponentHasMarks()
        {
            var gameId = await CreateStandardGame();

            // Player 1 closes 20
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            var (game1, _) = await _gameService.ConfirmTurnAsync(gameId);

            var player1 = game1.Players[0];
            Assert.Equal(0, player1.Score); // No score yet - opponent has 0 marks
        }

        [Fact]
        public async Task ScoringAfterClosed_ShouldScoreCorrectly()
        {
            var gameId = await CreateStandardGame();

            // Player 1 closes 20
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 3 }); // 3 marks
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 2 gets 1 mark on 20
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 1 hits 20 again - should score
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId);

            var player1 = game.Players[0];
            Assert.Equal(20, player1.Score); // 1 mark over 3 × 20 = 20
        }

        [Fact]
        public async Task DoubleScoring_ShouldScoreDouble()
        {
            var gameId = await CreateStandardGame();

            // Player 1 closes 20
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 3 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 2 gets 1 mark
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 1 hits D20 - should score 40
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 2 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId);

            var player1 = game.Players[0];
            Assert.Equal(40, player1.Score); // Double 20 = 40
        }

        [Fact]
        public async Task TripleScoring_ShouldScoreTriple()
        {
            var gameId = await CreateStandardGame();

            // Player 1 closes 20 with triple
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 3 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 2 gets 1 mark
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 1 hits T20 again - should score 60
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 3 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId);

            var player1 = game.Players[0];
            Assert.Equal(60, player1.Score); // Triple 20 = 60
        }

        #endregion

        #region Bed Tests

        [Fact]
        public async Task SimpleBed_FirstBed_ShouldNotScore()
        {
            var gameId = await CreateStandardGame();

            // Player 1: Bed of 20s (S20, S20, S20)
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Number" });

            var player1 = game.Players[0];
            var p1Data = player1.GetGameData<MickeyMousePlayerData>();

            Assert.Equal(3, p1Data.GetNumberMarks(20));
            Assert.Equal(0, player1.Score); // No opponent marks yet
        }

        [Fact]
        public async Task TwoConsecutiveBeds_ShouldScoreCorrectly()
        {
            var gameId = await CreateStandardGame();

            // Player 1: First bed
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Number" });

            // Player 2: Gets 1 mark on 20
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 1: Second bed
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Number" });

            var player1 = game.Players[0];
            var p1Data = player1.GetGameData<MickeyMousePlayerData>();

            Assert.Equal(6, p1Data.GetNumberMarks(20));
            Assert.Equal(60, player1.Score); // 3 × 20 = 60
        }

        [Fact]
        public async Task BedWithDoubles_ShouldScoreCorrectly()
        {
            var gameId = await CreateStandardGame();
            // Player 1: Bed with doubles (D20, D20, D20)
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 2 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 2 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 2 });
            var (game1, _) = await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Number" });
            var p1 = game1.Players[0];
            var p1Data = p1.GetGameData<MickeyMousePlayerData>();
            Assert.Equal(6, p1Data.GetNumberMarks(20)); // 2+2+2 = 6 marks
            Assert.Equal(80, p1.Score); // Bed replay: throws 2 and 3 scored (40+40)

            // Player 2: Get 1 mark
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 1: Hit another D20
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 2 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId);
            var player1 = game.Players[0];
            Assert.Equal(120, player1.Score); // Bed scored 80, then D20 scored 40
        }

        [Fact]
        public async Task BedAllocationToBeds_ShouldMarkBedsCategory()
        {
            var gameId = await CreateStandardGame();

            // Player 1: Bed allocated to Beds category
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Beds" });

            var player1 = game.Players[0];
            var p1Data = player1.GetGameData<MickeyMousePlayerData>();

            Assert.Equal(1, p1Data.BedsMarks); // 1 mark on Beds
            Assert.Equal(0, p1Data.GetNumberMarks(20)); // 0 marks on number 20
        }

        #endregion

        #region Shanghai Tests

        [Fact]
        public async Task Shanghai_ShouldAdd100Points()
        {
            var gameId = await CreateStandardGame();
            // Player 1: Shanghai (S20, D20, T20)
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 2 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 3 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId,
                new ConfirmTurnRequest { ShanghaiAllocation = "Number,Number,Number" });
            var player1 = game.Players[0];
            var p1Data = player1.GetGameData<MickeyMousePlayerData>();
            Assert.Equal(6, p1Data.GetNumberMarks(20)); // 1+2+3 = 6 marks
            Assert.Equal(220, player1.Score); // 100 bonus + 20 + 40 + 60 = 220
        }

        [Fact]
        public async Task Shanghai_CustomAllocation_ShouldWorkCorrectly()
        {
            var gameId = await CreateStandardGame();

            // Player 1: Shanghai allocated to different categories
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 2 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 3 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId,
                new ConfirmTurnRequest { ShanghaiAllocation = "Number,Doubles,Triples" });

            var player1 = game.Players[0];
            var p1Data = player1.GetGameData<MickeyMousePlayerData>();

            Assert.Equal(1, p1Data.GetNumberMarks(20)); // Single allocated to number
            Assert.Equal(1, p1Data.DoublesMarks); // Double to Doubles
            Assert.Equal(1, p1Data.TriplesMarks); // Triple to Triples
            Assert.Equal(120, player1.Score); // Shanghai bonus
        }

        #endregion

        #region Edge Cases

        [Fact]
        public async Task OpponentCloses_ShouldStopScoring()
        {
            var gameId = await CreateStandardGame();

            // Player 1: Close 20
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 3 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 2: Close 20
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 3 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 1: Hit 20 again - should NOT score (opponent closed)
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId);

            var player1 = game.Players[0];
            Assert.Equal(0, player1.Score); // No score - opponent closed
        }

        [Fact]
        public async Task Bull_ShouldWorkCorrectly()
        {
            var gameId = await CreateStandardGame();

            // Player 1: Hit bull 3 times
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 25, Multiplier = 1 }); // Single bull
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 25, Multiplier = 2 }); // Double bull
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId);

            var player1 = game.Players[0];
            var p1Data = player1.GetGameData<MickeyMousePlayerData>();

            Assert.Equal(3, p1Data.BullMarks); // 1 + 2 = 3 marks
        }

        #endregion

        [Fact]
        public async Task Player2ClosesFirst_ShouldStillScore()
        {
            var gameId = await CreateStandardGame();

            // Player 1: Doesn't hit 18
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 17, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 2: Closes 18
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 3 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 1: Still doesn't have 18 closed
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 17, Multiplier = 1 });
            await _gameService.ConfirmTurnAsync(gameId);

            // Player 2: Hits 18 again - SHOULD score because Player 1 hasn't closed
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 18, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 19, Multiplier = 1 });
            await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            var (game, _) = await _gameService.ConfirmTurnAsync(gameId);

            var player2 = game.Players[1];
            Assert.Equal(18, player2.Score); // Should score 18 points
        }
    }
}