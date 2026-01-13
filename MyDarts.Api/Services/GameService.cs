using MyDarts.Api.Domain.Engines;
using MyDarts.Api.Domain.Events;
using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;
using MyDarts.Api.Services.Interfaces;

namespace MyDarts.Api.Services
{
    public class GameService : IGameService
    {
        private readonly IGameEngineFactory _engineFactory;
        private readonly IGameSessionManager _sessionManager;
        private readonly IGameRepository _repository;
        private readonly IEventDispatcher _eventDispatcher;

        public GameService(
            IGameEngineFactory engineFactory,
            IGameSessionManager sessionManager,
            IGameRepository repository,
            IEventDispatcher eventDispatcher)
        {
            _engineFactory = engineFactory;
            _sessionManager = sessionManager;
            _repository = repository;
            _eventDispatcher = eventDispatcher;
        }

        public async Task<(GameState game, List<GameEvent> events)> CreateGameAsync(GameType gameType, List<string> playerNames, CreateGameRequest? options = null)
        {
            var engine = _engineFactory.GetEngine(gameType);
            var game = engine.CreateGame(playerNames, options);

            _sessionManager.AddGame(game);
            await _repository.SaveGameAsync(game);

            var events = new List<GameEvent>
            {
                new GameCreatedEvent
                {
                    GameId = game.GameId,
                    GameType = engine.DisplayName,
                    PlayerNames = playerNames
                }
            };

            await _eventDispatcher.DispatchAsync(events);

            return (game, events);
        }

        public GameState? GetGame(string gameId)
        {
            return _sessionManager.GetGame(gameId);
        }

        public async Task<(GameState game, List<GameEvent> events)> ProcessThrowAsync(string gameId, DartThrow dart)
        {
            var game = _sessionManager.GetGame(gameId);
            if (game == null)
                throw new InvalidOperationException($"Game not found: {gameId}");

            // Save snapshot for undo
            _sessionManager.SaveSnapshot(gameId, GameStateSnapshot.FromGameState(game));

            // Process throw
            var engine = _engineFactory.GetEngine(game.GameType);
            var (updatedGame, events) = engine.ProcessThrow(game, dart);

            // Update session
            _sessionManager.UpdateGame(updatedGame);

            // If game complete, persist
            if (updatedGame.Status == GameStatus.Complete)
            {
                await _repository.SaveGameAsync(updatedGame);
                // Don't remove - let session manager expire it after 5 minutes
            }

            // Dispatch events
            await _eventDispatcher.DispatchAsync(events);

            return (updatedGame, events);
        }

        public async Task<(GameState game, List<GameEvent> events)> EditThrowAsync(string gameId, int throwIndex, DartThrow dart)
        {
            var game = _sessionManager.GetGame(gameId);
            if (game == null)
                throw new InvalidOperationException($"Game not found: {gameId}");

            if (throwIndex < 0 || throwIndex >= game.ThrowsThisTurn)
                throw new InvalidOperationException($"Invalid throw index: {throwIndex}. Current turn has {game.ThrowsThisTurn} throws.");

            var player = game.CurrentPlayer;
            if (player == null)
                throw new InvalidOperationException("No current player");

            // Calculate the actual index in the player's throw list
            var turnStartIndex = player.Throws.Count - game.ThrowsThisTurn;
            var actualIndex = turnStartIndex + throwIndex;

            // Get all throws in this turn
            var throwsInTurn = player.Throws.Skip(turnStartIndex).ToList();

            // Replace the throw at the specified index
            throwsInTurn[throwIndex] = dart.Segment;

            // Now we need to replay the entire turn to recalculate position
            // First, restore player to state before this turn started

            // Find how many snapshots we need to go back (one per throw this turn)
            var snapshotsToRestore = game.ThrowsThisTurn;
            GameStateSnapshot? originalSnapshot = null;

            for (int i = 0; i < snapshotsToRestore; i++)
            {
                var snapshot = _sessionManager.PopSnapshot(gameId);
                if (snapshot != null)
                {
                    originalSnapshot = snapshot;
                }
            }

            if (originalSnapshot == null)
                throw new InvalidOperationException("Could not restore game state for edit");

            // Get stored allocations for Mickey Mouse BEFORE restoring
            List<AllocationChoice>? storedAllocations = null;
            if (game.GameType == GameType.MickeyMouse)
            {
                try
                {
                    var currentPlayer = game.CurrentPlayer;
                    if (currentPlayer != null)
                    {
                        var mmData = currentPlayer.GetGameData<MickeyMousePlayerData>();
                        storedAllocations = mmData?.TurnAllocations?.ToList(); // Clone the list
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Could not get stored allocations: {ex.Message}");
                }
            }

            // Restore to start of turn
            game = originalSnapshot.ToGameState();
            _sessionManager.UpdateGame(game);

            // Replay all throws with the edited one
            var engine = _engineFactory.GetEngine(game.GameType);
            var allEvents = new List<GameEvent>();

            for (int i = 0; i < throwsInTurn.Count; i++)
            {
                var throwSegment = throwsInTurn[i];
                var replayDart = ParseThrow(throwSegment);

                // If this is the edited throw, use the NEW allocation from the dart parameter
                if (i == throwIndex)
                {
                    replayDart.AllocationChoice = dart.AllocationChoice;
                }
                // Otherwise, use stored allocation if available (Mickey Mouse)
                else if (storedAllocations != null && i < storedAllocations.Count)
                {
                    replayDart.AllocationChoice = storedAllocations[i];
                }

                // Save snapshot before each throw (so undo still works)
                _sessionManager.SaveSnapshot(gameId, GameStateSnapshot.FromGameState(game));

                var (updatedGame, events) = engine.ProcessThrow(game, replayDart);
                game = updatedGame;
                allEvents.AddRange(events);

                _sessionManager.UpdateGame(game);

                // If game completed during replay, stop
                if (game.Status == GameStatus.Complete)
                {
                    await _repository.SaveGameAsync(game);
                    _sessionManager.RemoveGame(gameId);
                    break;
                }
            }

            return (game, allEvents);
        }

        private DartThrow ParseThrow(string segment)
        {
            var multiplier = segment[0] switch
            {
                'T' => 3,
                'D' => 2,
                _ => 1
            };
            var valueStr = segment.Substring(1);
            var value = int.TryParse(valueStr, out var v) ? v : 0;

            return new DartThrow { Segment = segment, Value = value, Multiplier = multiplier };
        }

        public GameState? UndoLastThrow(string gameId)
        {
            var snapshot = _sessionManager.PopSnapshot(gameId);
            if (snapshot == null) return null;

            var game = snapshot.ToGameState();
            _sessionManager.UpdateGame(game);
            return game;
        }

        public async Task<(GameState game, List<GameEvent> events)> ConfirmTurnAsync(string gameId, ConfirmTurnRequest? request = null)
        {
            Console.WriteLine($"\n===== CONFIRM TURN CALLED =====");
            Console.WriteLine($"GameId: {gameId}");
            Console.WriteLine($"BedAllocation: {request?.BedAllocation ?? "null"}");
            Console.WriteLine($"ShanghaiAllocation: {request?.ShanghaiAllocation ?? "null"}");
            Console.WriteLine($"================================\n");

            var game = _sessionManager.GetGame(gameId);
            if (game == null)
                throw new InvalidOperationException($"Game not found: {gameId}");

            if (!game.TurnComplete)
                throw new InvalidOperationException("Turn is not complete yet");

            var events = new List<GameEvent>();
            var previousPlayer = game.CurrentPlayer;

            // Handle Mickey Mouse bed/shanghai allocations if provided
            if (game.GameType == GameType.MickeyMouse && request != null && previousPlayer != null)
            {
                var engine = _engineFactory.GetEngine(game.GameType) as MickeyMouseEngine;

                // Handle Shanghai allocation (takes priority, add 100 points)
                if (!string.IsNullOrEmpty(request.ShanghaiAllocation) && game.ShanghaiPendingAllocation && previousPlayer != null)
                {
                    var playerData = previousPlayer.GetGameData<MickeyMousePlayerData>();
                    if (playerData != null)
                    {
                        // Parse the allocations (format: "Single,Double,Triple" e.g., "Number,Doubles,Triples")
                        var allocations = request.ShanghaiAllocation.Split(',');
                        if (allocations.Length == 3)
                        {
                            // Map string allocations to enum values
                            var singleAlloc = ParseAllocation(allocations[0]);
                            var doubleAlloc = ParseAllocation(allocations[1]);
                            var tripleAlloc = ParseAllocation(allocations[2]);

                            // Add 100 points for Shanghai
                            playerData.Score += 100;
                            previousPlayer.Score = playerData.Score;

                            // Restore and replay turn with chosen allocations
                            var turnStartIndex = previousPlayer.Throws.Count - game.ThrowsThisTurn;
                            var throwsInTurn = previousPlayer.Throws.Skip(turnStartIndex).ToList();

                            // Restore to before this turn
                            for (int i = 0; i < game.ThrowsThisTurn; i++)
                            {
                                var snapshot = _sessionManager.PopSnapshot(gameId);
                                if (snapshot != null && i == game.ThrowsThisTurn - 1)
                                {
                                    game = snapshot.ToGameState();
                                }
                            }

                            // Re-add the 100 points after restore
                            previousPlayer = game.CurrentPlayer;
                            if (previousPlayer != null)
                            {
                                var restoredData = previousPlayer.GetGameData<MickeyMousePlayerData>();
                                if (restoredData != null)
                                {
                                    restoredData.Score += 100;
                                    previousPlayer.Score = restoredData.Score;
                                    previousPlayer.SetGameData(restoredData);
                                }
                            }

                            // Replay throws with individual allocations (match by multiplier, not index)
                            var shanghaiEngine = _engineFactory.GetEngine(game.GameType);
                            for (int i = 0; i < throwsInTurn.Count; i++)
                            {
                                var throwSegment = throwsInTurn[i];
                                var replayDart = ParseThrow(throwSegment);

                                // Match allocation to dart multiplier
                                if (replayDart.Multiplier == 1)
                                    replayDart.AllocationChoice = singleAlloc;
                                else if (replayDart.Multiplier == 2)
                                    replayDart.AllocationChoice = doubleAlloc;
                                else if (replayDart.Multiplier == 3)
                                    replayDart.AllocationChoice = tripleAlloc;

                                replayDart.IsShanghaiReplay = true;

                                var (updatedGame, _) = shanghaiEngine.ProcessThrow(game, replayDart);
                                game = updatedGame;
                                _sessionManager.UpdateGame(game);
                            }

                            game.ShanghaiPendingAllocation = false;
                            previousPlayer = game.CurrentPlayer;
                        }
                    }
                }

                // Handle Bed allocation
                if (!string.IsNullOrEmpty(request.BedAllocation) && game.BedPendingAllocation && previousPlayer != null)
                {
                    Console.WriteLine($"\n========== BED ALLOCATION CALLED ==========");
                    Console.WriteLine($"BedAllocation: {request.BedAllocation}");
                    Console.WriteLine($"==========================================\n");

                    // Check if it's a custom allocation (comma-separated: "Single,Double,Triple")
                    if (request.BedAllocation.Contains(','))
                    {
                        // Custom allocation - parse and replay like Shanghai
                        var allocations = request.BedAllocation.Split(',');
                        if (allocations.Length == 3)
                        {
                            var singleAlloc = ParseAllocation(allocations[0]);
                            var doubleAlloc = ParseAllocation(allocations[1]);
                            var tripleAlloc = ParseAllocation(allocations[2]);

                            // Get throw segments BEFORE restore
                            var turnStartIndex = previousPlayer.Throws.Count - game.ThrowsThisTurn;
                            var throwsInTurn = previousPlayer.Throws.Skip(turnStartIndex).ToList();

                            // Restore to BEFORE this turn - pop all snapshots from this turn
                            GameStateSnapshot? oldestSnapshot = null;
                            for (int i = 0; i < game.ThrowsThisTurn; i++)
                            {
                                var snapshot = _sessionManager.PopSnapshot(gameId);
                                oldestSnapshot = snapshot; // Last pop = oldest snapshot
                            }

                            if (oldestSnapshot != null)
                            {
                                game = oldestSnapshot.ToGameState();
                            }

                            // Get fresh player reference after restore
                            previousPlayer = game.Players.FirstOrDefault(p => p.Id == previousPlayer?.Id);
                            if (previousPlayer == null) return (game, events);

                            // Replay throws with individual allocations
                            var bedEngine = _engineFactory.GetEngine(game.GameType);

                            foreach (var throwSegment in throwsInTurn)
                            {
                                var replayDart = ParseThrow(throwSegment);

                                // Match allocation to dart multiplier
                                if (replayDart.Multiplier == 1)
                                    replayDart.AllocationChoice = singleAlloc;
                                else if (replayDart.Multiplier == 2)
                                    replayDart.AllocationChoice = doubleAlloc;
                                else if (replayDart.Multiplier == 3)
                                    replayDart.AllocationChoice = tripleAlloc;

                                var (updatedGame, _) = bedEngine.ProcessThrow(game, replayDart);
                                game = updatedGame;
                                _sessionManager.UpdateGame(game);
                            }

                            game.BedPendingAllocation = false;
                            previousPlayer = game.CurrentPlayer;
                        }
                    }
                    else
                    {
                        // Simple allocation - "Number" or "Beds"
                        var bedAlloc = ParseAllocation(request.BedAllocation);

                        // Save bed number before restore (gets lost during restore)
                        var savedBedNumber = game.BedNumber;

                        // Get throw segments BEFORE restore
                        var turnStartIndex = previousPlayer.Throws.Count - game.ThrowsThisTurn;
                        var throwsInTurn = previousPlayer.Throws.Skip(turnStartIndex).ToList();

                        // Restore to BEFORE this turn - pop all snapshots from this turn PLUS the base snapshot
                        GameStateSnapshot? oldestSnapshot = null;
                        for (int i = 0; i < game.ThrowsThisTurn + 1; i++)  // +1 to include base snapshot
                        {
                            var snapshot = _sessionManager.PopSnapshot(gameId);
                            if (snapshot != null)
                            {
                                oldestSnapshot = snapshot;
                            }
                        }

                        if (oldestSnapshot != null)
                        {
                            game = oldestSnapshot.ToGameState();
                        }

                        // Restore bed number after game state restore
                        game.BedNumber = savedBedNumber;

                        // Get fresh player reference after restore
                        previousPlayer = game.Players.FirstOrDefault(p => p.Id == previousPlayer?.Id);
                        if (previousPlayer == null) return (game, events);

                        Console.WriteLine($"=== REPLAYING BED ===");
                        Console.WriteLine($"Player: {previousPlayer.Name}, Bed Number: {game.BedNumber}");

                        // ADD THE LOGGING HERE - INSIDE THIS ELSE BLOCK:
                        var beforeData = previousPlayer.GetGameData<MickeyMousePlayerData>();
                        Console.WriteLine($"AFTER RESTORE - {previousPlayer.Name} has {previousPlayer.Throws.Count} throws, {beforeData?.GetNumberMarks(game.BedNumber)} marks on {game.BedNumber}");

                        // Replay all 3 throws with the bed allocation
                        var bedEngine2 = _engineFactory.GetEngine(game.GameType);
                        int throwNum = 0;
                        foreach (var throwSegment in throwsInTurn)
                        {
                            throwNum++;
                            var replayDart = ParseThrow(throwSegment);
                            replayDart.AllocationChoice = bedAlloc;

                            var (updatedGame, _) = bedEngine2.ProcessThrow(game, replayDart);
                            game = updatedGame;
                            _sessionManager.UpdateGame(game);

                            var afterData = game.CurrentPlayer?.GetGameData<MickeyMousePlayerData>();
                            var opponent = game.Players.FirstOrDefault(p => p.Id != game.CurrentPlayer?.Id);
                            var opponentData = opponent?.GetGameData<MickeyMousePlayerData>();
                            Console.WriteLine($"Throw {throwNum}: {throwSegment} -> Jake: {afterData?.GetNumberMarks(game.BedNumber)} marks, Score={game.CurrentPlayer?.Score}, Test: {opponentData?.GetNumberMarks(game.BedNumber)} marks");
                        }

                        Console.WriteLine($"=== BED REPLAY COMPLETE ===");
                        game.BedPendingAllocation = false;
                        previousPlayer = game.CurrentPlayer;
                    }
                }
            }

            // Move to next player
            game.CurrentPlayerIndex = (game.CurrentPlayerIndex + 1) % game.Players.Count;
            game.ThrowsThisTurn = 0;
            game.ConsecutiveHits = 0;
            game.TurnComplete = false;
            game.BedPendingAllocation = false;
            game.ShanghaiPendingAllocation = false;

            // Clear ALL snapshots from the completed turn
            Console.WriteLine($"=== CLEARING SNAPSHOTS ===");
            int snapshotCount = 0;
            while (_sessionManager.HasSnapshots(gameId))
            {
                _sessionManager.PopSnapshot(gameId);
                snapshotCount++;
            }
            Console.WriteLine($"Cleared {snapshotCount} snapshots");

            // CRITICAL FIX: Save a fresh base snapshot for the NEW player's turn
            // Without this, the next turn's snapshots will contain stale state from previous turns
            _sessionManager.SaveSnapshot(gameId, GameStateSnapshot.FromGameState(game));
            Console.WriteLine($"Saved base snapshot for {game.CurrentPlayer.Name}'s turn\n");

            var nextPlayer = game.CurrentPlayer;
            events.Add(new TurnEndedEvent
            {
                GameId = game.GameId,
                PlayerId = previousPlayer?.Id ?? "",
                PlayerName = previousPlayer?.Name ?? "",
                NextPlayerId = nextPlayer?.Id ?? "",
                NextPlayerName = nextPlayer?.Name ?? "",
                TotalThrowsInTurn = previousPlayer?.Throws.Count ?? 0,
                HitsInTurn = 0
            });

            _sessionManager.UpdateGame(game);
            await _eventDispatcher.DispatchAsync(events);

            return (game, events);
        }

        public IEnumerable<GameTypeInfo> GetAvailableGameTypes()
        {
            return _engineFactory.GetAvailableGameTypes();
        }

        private MickeyMouseOptions GetGameOptions(GameState game)
        {
            if (string.IsNullOrEmpty(game.GameSettingsJson))
                return new MickeyMouseOptions();

            return System.Text.Json.JsonSerializer.Deserialize<MickeyMouseOptions>(game.GameSettingsJson)
                   ?? new MickeyMouseOptions();
        }

        private AllocationChoice ParseAllocation(string allocation)
        {
            return allocation switch
            {
                "Doubles" => AllocationChoice.Doubles,
                "Triples" => AllocationChoice.Triples,
                "Beds" => AllocationChoice.Beds,
                "Skip" => AllocationChoice.Skip,
                _ => AllocationChoice.Number
            };
        }
    }
}