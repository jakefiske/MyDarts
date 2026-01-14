using Xunit;
using Xunit.Abstractions;
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
    public class DebugTest
    {
        private readonly ITestOutputHelper _output;
        private readonly GameService _gameService;
        private readonly IGameSessionManager _sessionManager;

        public DebugTest(ITestOutputHelper output)
        {
            _output = output;
            _sessionManager = new InMemoryGameSessionManager();
            var engineFactory = new GameEngineFactory(new List<IGameEngine> { new MickeyMouseEngine() });
            var mockRepo = new Mock<IGameRepository>();
            mockRepo.Setup(r => r.SaveGameAsync(It.IsAny<GameState>())).Returns(Task.CompletedTask);
            var mockDispatcher = new Mock<IEventDispatcher>();
            mockDispatcher.Setup(e => e.DispatchAsync(It.IsAny<List<GameEvent>>())).Returns(Task.CompletedTask);
            _gameService = new GameService(engineFactory, _sessionManager, mockRepo.Object, mockDispatcher.Object);
        }

        [Fact]
        public async Task Debug_WhatIsHappening()
        {
            var (game, _) = await _gameService.CreateGameAsync(
                GameType.MickeyMouse,
                new List<string> { "Jake", "Test" },
                new CreateGameRequest
                {
                    MickeyMouseOptions = new MickeyMouseOptions
                    {
                        LowestNumber = 15,
                        IncludeDoubles = false,
                        IncludeTriples = false,
                        IncludeBeds = true
                    }
                });

            var gameId = game.GameId;
            _output.WriteLine($"Game created: {gameId}");

            // Check initial state
            var jake = game.Players[0];
            var jakeData = jake.GetGameData<MickeyMousePlayerData>();
            _output.WriteLine($"Initial - Jake marks on 20: {jakeData?.GetNumberMarks(20)}");
            _output.WriteLine($"Initial - Jake GameDataJson: {jake.GameDataJson}");

            // Throw 1
            var (g1, _) = await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            _output.WriteLine($"After throw 1 - ThrowsThisTurn: {g1.ThrowsThisTurn}");
            var j1 = g1.CurrentPlayer;
            var jd1 = j1?.GetGameData<MickeyMousePlayerData>();
            _output.WriteLine($"After throw 1 - Jake marks on 20: {jd1?.GetNumberMarks(20)}");
            _output.WriteLine($"After throw 1 - Jake throws: {string.Join(",", j1?.Throws ?? new List<string>())}");

            // Throw 2
            var (g2, _) = await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            _output.WriteLine($"After throw 2 - ThrowsThisTurn: {g2.ThrowsThisTurn}");
            var j2 = g2.CurrentPlayer;
            var jd2 = j2?.GetGameData<MickeyMousePlayerData>();
            _output.WriteLine($"After throw 2 - Jake marks on 20: {jd2?.GetNumberMarks(20)}");

            // Throw 3
            var (g3, _) = await _gameService.ProcessThrowAsync(gameId, new DartThrow { Value = 20, Multiplier = 1 });
            _output.WriteLine($"After throw 3 - ThrowsThisTurn: {g3.ThrowsThisTurn}");
            _output.WriteLine($"After throw 3 - TurnComplete: {g3.TurnComplete}");
            _output.WriteLine($"After throw 3 - BedPendingAllocation: {g3.BedPendingAllocation}");
            _output.WriteLine($"After throw 3 - BedNumber: {g3.BedNumber}");
            var j3 = g3.CurrentPlayer;
            var jd3 = j3?.GetGameData<MickeyMousePlayerData>();
            _output.WriteLine($"After throw 3 - Jake marks on 20: {jd3?.GetNumberMarks(20)}");
            _output.WriteLine($"After throw 3 - Jake GameDataJson: {j3?.GameDataJson}");

            // Confirm turn
            var (g4, _) = await _gameService.ConfirmTurnAsync(gameId, new ConfirmTurnRequest { BedAllocation = "Number" });
            _output.WriteLine($"After confirm - CurrentPlayerIndex: {g4.CurrentPlayerIndex}");
            var jakeAfter = g4.Players[0];
            var jakeDataAfter = jakeAfter.GetGameData<MickeyMousePlayerData>();
            _output.WriteLine($"After confirm - Jake marks on 20: {jakeDataAfter?.GetNumberMarks(20)}");
            _output.WriteLine($"After confirm - Jake GameDataJson: {jakeAfter.GameDataJson}");

            Assert.Equal(3, jakeDataAfter?.GetNumberMarks(20));
        }
    }
}