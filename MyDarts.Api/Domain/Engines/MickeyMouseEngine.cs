using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;

namespace MyDarts.Api.Domain.Engines
{
    public class MickeyMouseEngine : BaseGameEngine
    {
        public override GameType GameType => GameType.MickeyMouse;
        public override string DisplayName => "Mickey Mouse Cricket";
        public override string Description => "Cricket with Doubles, Triples, Beds, and Shanghai bonuses!";

        protected override int GetStartingPosition() => 0;

        protected override Player CreatePlayer(string name, CreateGameRequest? options = null)
        {
            var mmOptions = options?.MickeyMouseOptions ?? new MickeyMouseOptions();

            var player = new Player
            {
                Id = Guid.NewGuid().ToString(),
                Name = name,
                Position = 0,
                Score = 0,
                IsWinner = false
            };

            var playerData = new MickeyMousePlayerData();

            // Initialize number marks based on configuration
            var numbers = GetNumbersList(mmOptions.LowestNumber);
            foreach (var num in numbers)
            {
                playerData.NumberMarks[num] = 0;
            }

            player.SetGameData(playerData);
            return player;
        }

        protected override void InitializeGame(GameState game, CreateGameRequest? options = null)
        {
            // Store game options for later use
            var mmOptions = options?.MickeyMouseOptions ?? new MickeyMouseOptions();
            game.GameSettingsJson = System.Text.Json.JsonSerializer.Serialize(mmOptions);
        }

        private List<int> GetNumbersList(int lowestNumber)
        {
            var numbers = new List<int>();
            for (int i = 20; i >= lowestNumber; i--)
            {
                numbers.Add(i);
            }
            return numbers;
        }

        private MickeyMouseOptions GetGameOptions(GameState game)
        {
            if (string.IsNullOrEmpty(game.GameSettingsJson))
                return new MickeyMouseOptions();

            return System.Text.Json.JsonSerializer.Deserialize<MickeyMouseOptions>(game.GameSettingsJson)
                   ?? new MickeyMouseOptions();
        }

        protected override ThrowResult ProcessPlayerThrow(GameState game, Player player, DartThrow dart)
        {
            Console.WriteLine($"\n=== THROW: {player.Name} throwing {new string('T', dart.Multiplier == 3 ? 1 : 0)}{new string('D', dart.Multiplier == 2 ? 1 : 0)}{new string('S', dart.Multiplier == 1 ? 1 : 0)}{dart.Value}");
            foreach (var p in game.Players)
            {
                var pd = p.GetGameData<MickeyMousePlayerData>();
                Console.WriteLine($"  {p.Name}: {pd?.GetNumberMarks(20)} marks on 20");
            }
            var playerData = player.GetGameData<MickeyMousePlayerData>();
            if (playerData == null)
            {
                playerData = new MickeyMousePlayerData();
                player.SetGameData(playerData);
            }

            var options = GetGameOptions(game);
            var numbers = GetNumbersList(options.LowestNumber);

            string message = "";
            bool wasHit = false;

            // Reset turn allocations at start of turn
            if (game.ThrowsThisTurn == 0)
            {
                playerData.HasShanghaiThisTurn = false;
                playerData.ShanghaiNumber = 0;
                playerData.TurnAllocations = new List<AllocationChoice>();
            }

            // Determine allocation - use smart auto-allocation if not specified
            AllocationChoice allocation;
            if (dart.AllocationChoice.HasValue)
            {
                allocation = dart.AllocationChoice.Value;
            }
            else
            {
                allocation = DetermineSmartAllocation(game, player, dart, playerData, options, numbers);
                Console.WriteLine($">>> ALLOCATION CHOSEN: {allocation}");
            }

            // Store this allocation
            playerData.TurnAllocations.Add(allocation);

            // Handle Skip - no marks added, just return
            if (allocation == AllocationChoice.Skip)
            {
                player.SetGameData(playerData);
                return new ThrowResult
                {
                    WasHit = true,
                    Message = "Skipped (100 points only)"
                };
            }

            // Process based on allocation choice - CHECK CATEGORIES FIRST (allow any number)
            if (dart.Value == 25)
            {
                // Bull - always goes to bull
                wasHit = true;
                playerData.BullMarks += dart.Multiplier;

                if (playerData.BullMarks >= 3)
                {
                    message = "Bull closed!";
                }
                else
                {
                    string markSymbol = playerData.BullMarks == 1 ? "/" : "X";
                    message = $"{markSymbol} on Bull";
                }
            }
            else if (allocation == AllocationChoice.Doubles && dart.Multiplier == 2 && options.IncludeDoubles)
            {
                // ANY double counts toward Doubles category
                wasHit = true;
                playerData.DoublesMarks++;

                // Check if opponent has closed Doubles
                bool opponentHasClosedDoubles = game.Players
                    .Where(p => p.Id != player.Id)
                    .All(p =>
                    {
                        var oppData = p.GetGameData<MickeyMousePlayerData>();
                        return oppData != null && oppData.DoublesMarks >= 3;
                    });

                // Score points if we have 3+ marks and opponent doesn't
                if (playerData.DoublesMarks >= 3 && !opponentHasClosedDoubles)
                {
                    int pointsToAdd = dart.Value * dart.Multiplier;
                    playerData.Score += pointsToAdd;
                    player.Score = playerData.Score;
                    string markSymbol = playerData.DoublesMarks == 3 ? "⭕" : "⭕";
                    message = $"{markSymbol} on Doubles (D{dart.Value}) +{pointsToAdd} pts";
                }
                else if (playerData.DoublesMarks == 3)
                {
                    message = $"⭕ on Doubles (D{dart.Value})";
                }
                else
                {
                    string markSymbol = playerData.DoublesMarks == 1 ? "/" : "X";
                    message = $"{markSymbol} on Doubles (D{dart.Value})";
                }
            }
            else if (allocation == AllocationChoice.Triples && dart.Multiplier == 3 && options.IncludeTriples)
            {
                // ANY triple counts toward Triples category
                wasHit = true;
                playerData.TriplesMarks++;

                // Check if opponent has closed Triples
                bool opponentHasClosedTriples = game.Players
                    .Where(p => p.Id != player.Id)
                    .All(p =>
                    {
                        var oppData = p.GetGameData<MickeyMousePlayerData>();
                        return oppData != null && oppData.TriplesMarks >= 3;
                    });

                // Score points if we have 3+ marks and opponent doesn't
                if (playerData.TriplesMarks >= 3 && !opponentHasClosedTriples)
                {
                    int pointsToAdd = dart.Value * dart.Multiplier;
                    playerData.Score += pointsToAdd;
                    player.Score = playerData.Score;
                    string markSymbol = playerData.TriplesMarks == 3 ? "⭕" : "⭕";
                    message = $"{markSymbol} on Triples (T{dart.Value}) +{pointsToAdd} pts";
                }
                else if (playerData.TriplesMarks == 3)
                {
                    message = $"⭕ on Triples (T{dart.Value})";
                }
                else
                {
                    string markSymbol = playerData.TriplesMarks == 1 ? "/" : "X";
                    message = $"{markSymbol} on Triples (T{dart.Value})";
                }
            }
            else if (allocation == AllocationChoice.Beds && options.IncludeBeds)
            {
                // Bed allocation - only count once per turn
                wasHit = true;
                if (game.ThrowsThisTurn == 1)
                {
                    playerData.BedsMarks++;

                    // Check if opponent has closed Beds
                    bool opponentHasClosedBeds = game.Players
                        .Where(p => p.Id != player.Id)
                        .All(p =>
                        {
                            var oppData = p.GetGameData<MickeyMousePlayerData>();
                            return oppData != null && oppData.BedsMarks >= 3;
                        });

                    // Score points if we have 3+ marks and opponent doesn't
                    // For beds, score is dart.Value * 3 (since it's single+double+triple)
                    if (playerData.BedsMarks >= 3 && !opponentHasClosedBeds)
                    {
                        int pointsToAdd = dart.Value * 3; // 1x + 2x + 3x = 6x total
                        playerData.Score += pointsToAdd;
                        player.Score = playerData.Score;
                        string markSymbol = playerData.BedsMarks == 3 ? "⭕" : "⭕";
                        message = $"{markSymbol} on Beds +{pointsToAdd} pts";
                    }
                    else if (playerData.BedsMarks == 3)
                    {
                        message = $"⭕ on Beds";
                    }
                    else
                    {
                        string markSymbol = playerData.BedsMarks == 1 ? "/" : "X";
                        message = $"{markSymbol} on Beds";
                    }
                }
                else
                {
                    message = "Bed (already counted)";
                }
            }
            else if (numbers.Contains(dart.Value))
            {
                Console.WriteLine($"Processing number {dart.Value}, multiplier {dart.Multiplier}");
                // Mickey Mouse number allocation
                wasHit = true;
                int currentMarks = playerData.GetNumberMarks(dart.Value);
                int marksToAdd = dart.Multiplier;
                int newMarks = currentMarks + marksToAdd;
                playerData.NumberMarks[dart.Value] = newMarks;

                // Calculate opponent closure status once
                bool opponentHasClosed = game.Players
                    .Where(p => p.Id != player.Id)
                    .All(p =>
                    {
                        var oppData = p.GetGameData<MickeyMousePlayerData>();
                        var isClosed = oppData != null && oppData.IsNumberClosed(dart.Value);
                        Console.WriteLine($"Opponent {p.Name}: {oppData?.GetNumberMarks(dart.Value)} marks on {dart.Value}, closed={isClosed}");
                        return isClosed;
                    });

                Console.WriteLine($"opponentHasClosed={opponentHasClosed}, newMarks={newMarks}");

                // For Shanghai replay to Number, ALWAYS score the throw value (regardless of marks)
                if (dart.IsShanghaiReplay && allocation == AllocationChoice.Number)
                {
                    int pointsToAdd = dart.Value * dart.Multiplier;
                    playerData.Score += pointsToAdd;
                    player.Score = playerData.Score;
                    message = $"+{pointsToAdd} points on {dart.Value} (Shanghai)!";
                }
                // Check for scoring (normal cricket - only when closed or more)
                else if (newMarks >= 3)
                {
                    if (!opponentHasClosed && newMarks > 3)
                    {
                        // Normal cricket scoring: score only after closing and opponent hasn't closed
                        int pointsToAdd = dart.Value * dart.Multiplier;
                        playerData.Score += pointsToAdd;
                        player.Score = playerData.Score;
                        message = $"+{pointsToAdd} points on {dart.Value}!";
                    }
                    else if (newMarks == 3)
                    {
                        message = $"{dart.Value} closed!";
                    }
                    else
                    {
                        message = $"{dart.Value} already closed by opponent";
                    }
                }
                else
                {
                    // Less than 3 marks - just show mark symbol
                    string markSymbol = newMarks == 1 ? "/" : "X";
                    message = $"{markSymbol} on {dart.Value}";
                }
            }
            else
            {
                // Not a Mickey Mouse number and not allocated to a category
                message = "Not a Mickey Mouse number";
            }

            player.SetGameData(playerData);

            return new ThrowResult
            {
                WasHit = wasHit,
                Message = message
            };
        }

        protected override bool CheckWinCondition(GameState game, Player player)
        {
            var playerData = player.GetGameData<MickeyMousePlayerData>();
            if (playerData == null) return false;

            var options = GetGameOptions(game);
            var numbers = GetNumbersList(options.LowestNumber);

            // Check if all categories closed
            if (!playerData.AllClosed(numbers, options.IncludeDoubles, options.IncludeTriples, options.IncludeBeds))
                return false;

            // In single player, just need to close all
            if (game.Players.Count == 1)
                return true;

            // In multiplayer, need highest score AND all closed
            var maxScore = game.Players.Max(p =>
            {
                var data = p.GetGameData<MickeyMousePlayerData>();
                return data?.Score ?? 0;
            });

            return playerData.Score >= maxScore;
        }

        protected override string GetTargetDisplay(Player player)
        {
            var playerData = player.GetGameData<MickeyMousePlayerData>();
            if (playerData == null) return "20";

            // Find first unclosed number
            var options = new MickeyMouseOptions(); // We'd need to get this from game state ideally
            var numbers = GetNumbersList(options.LowestNumber);

            foreach (var number in numbers)
            {
                if (!playerData.IsNumberClosed(number))
                {
                    return number.ToString();
                }
            }

            // Check categories
            if (playerData.BullMarks < 3) return "Bull";
            if (playerData.DoublesMarks < 3) return "Doubles";
            if (playerData.TriplesMarks < 3) return "Triples";
            if (playerData.BedsMarks < 3) return "Beds";

            return "All Closed";
        }

        protected override bool ShouldEndTurn(GameState game, ThrowResult result)
        {
            // Check if we should end the turn after 3 darts
            if (game.ThrowsThisTurn >= 3)
            {
                var currentPlayer = game.CurrentPlayer;
                if (currentPlayer != null)
                {
                    // Check for Shanghai first (takes priority)
                    var (hasShanghai, shanghaiNumber) = DetectShanghai(game, currentPlayer);
                    if (hasShanghai)
                    {
                        game.ShanghaiPendingAllocation = true;
                        game.ShanghaiNumber = shanghaiNumber;
                    }
                    else
                    {
                        // Check for bed (only if not shanghai)
                        var (hasBed, bedNumber) = DetectBed(game, currentPlayer);
                        if (hasBed)
                        {
                            game.BedPendingAllocation = true;
                            game.BedNumber = bedNumber;
                        }
                    }
                }

                return true;
            }

            return false;
        }

        private (bool hasShanghai, int shanghaiNumber) DetectShanghai(GameState game, Player player)
        {
            if (game.ThrowsThisTurn != 3) return (false, 0);

            var currentPlayer = game.CurrentPlayer;
            if (currentPlayer == null || currentPlayer.Id != player.Id) return (false, 0);

            var lastThreeThrows = currentPlayer.Throws.TakeLast(3).ToList();
            if (lastThreeThrows.Count != 3) return (false, 0);

            // Parse the throws
            var throws = lastThreeThrows.Select(ParseThrow).ToList();

            // Check if all same number
            var number = throws[0].Value;
            if (!throws.All(t => t.Value == number)) return (false, 0);

            // Check if we have S, D, and T (multipliers 1, 2, 3)
            var multipliers = throws.Select(t => t.Multiplier).OrderBy(m => m).ToList();
            bool isShanghai = multipliers.SequenceEqual(new[] { 1, 2, 3 });

            return (isShanghai, number);
        }

        private (bool hasBed, int bedNumber) DetectBed(GameState game, Player player)
        {
            if (game.ThrowsThisTurn != 3) return (false, 0);

            var currentPlayer = game.CurrentPlayer;
            if (currentPlayer == null || currentPlayer.Id != player.Id) return (false, 0);

            var lastThreeThrows = currentPlayer.Throws.TakeLast(3).ToList();
            if (lastThreeThrows.Count != 3) return (false, 0);

            // Parse the throws and get their values
            var throws = lastThreeThrows.Select(ParseThrow).ToList();

            // Check if all 3 are the same number (but different multipliers ideally)
            var number = throws[0].Value;
            if (throws.All(t => t.Value == number))
            {
                return (true, number);
            }

            return (false, 0);
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

            return new DartThrow { Value = value, Multiplier = multiplier };
        }

        private AllocationChoice DetermineSmartAllocation(
            GameState game,
            Player player,
            DartThrow dart,
            MickeyMousePlayerData playerData,
            MickeyMouseOptions options,
            List<int> numbers)
        {
            // For bull, always allocate to bull
            if (dart.Value == 25) return AllocationChoice.Number;

            // For non-Mickey Mouse numbers, can only go to Doubles/Triples
            if (!numbers.Contains(dart.Value))
            {
                bool doublesClosedByMe = playerData.DoublesMarks >= 3;
                bool triplesClosedByMe = playerData.TriplesMarks >= 3;

                bool opponentHasDoublesClosed = game.Players
                    .Where(p => p.Id != player.Id)
                    .Any(p =>
                    {
                        var oppData = p.GetGameData<MickeyMousePlayerData>();
                        return oppData != null && oppData.DoublesMarks >= 3;
                    });

                bool opponentHasTriplesClosed = game.Players
                    .Where(p => p.Id != player.Id)
                    .Any(p =>
                    {
                        var oppData = p.GetGameData<MickeyMousePlayerData>();
                        return oppData != null && oppData.TriplesMarks >= 3;
                    });

                // Try to score on Doubles/Triples
                if (dart.Multiplier == 2 && options.IncludeDoubles && !doublesClosedByMe && !opponentHasDoublesClosed)
                {
                    return AllocationChoice.Doubles;
                }
                if (dart.Multiplier == 3 && options.IncludeTriples && !triplesClosedByMe && !opponentHasTriplesClosed)
                {
                    return AllocationChoice.Triples;
                }

                // Try to close Doubles/Triples
                if (dart.Multiplier == 2 && options.IncludeDoubles && !doublesClosedByMe)
                {
                    return AllocationChoice.Doubles;
                }
                if (dart.Multiplier == 3 && options.IncludeTriples && !triplesClosedByMe)
                {
                    return AllocationChoice.Triples;
                }

                // Everything closed - skip
                return AllocationChoice.Skip;
            }

            // For Mickey Mouse numbers
            bool numberClosedByMe = playerData.IsNumberClosed(dart.Value);
            Console.WriteLine($">>> SMART ALLOC for {dart.Value}: numberClosedByMe={numberClosedByMe}");
            bool doublesClosedByMe2 = playerData.DoublesMarks >= 3;
            bool triplesClosedByMe2 = playerData.TriplesMarks >= 3;

            bool opponentHasNumberClosed = game.Players
                .Where(p => p.Id != player.Id)
                .Any(p =>
                {
                    var oppData = p.GetGameData<MickeyMousePlayerData>();
                    return oppData != null && oppData.IsNumberClosed(dart.Value);
                });

            bool opponentHasDoublesClosed2 = game.Players
                .Where(p => p.Id != player.Id)
                .Any(p =>
                {
                    var oppData = p.GetGameData<MickeyMousePlayerData>();
                    return oppData != null && oppData.DoublesMarks >= 3;
                });

            bool opponentHasTriplesClosed2 = game.Players
                .Where(p => p.Id != player.Id)
                .Any(p =>
                {
                    var oppData = p.GetGameData<MickeyMousePlayerData>();
                    return oppData != null && oppData.TriplesMarks >= 3;
                });

            // Priority 1: Mark/Score the number unless BOTH players have closed it
            if (!numberClosedByMe || !opponentHasNumberClosed)
            {
                return AllocationChoice.Number;
            }

            // Priority 2: Number is closed BY ME - try Doubles/Triples for scoring
            if (numberClosedByMe && dart.Multiplier == 2 && options.IncludeDoubles && !doublesClosedByMe2 && !opponentHasDoublesClosed2)
            {
                return AllocationChoice.Doubles;
            }
            if (numberClosedByMe && dart.Multiplier == 3 && options.IncludeTriples && !triplesClosedByMe2 && !opponentHasTriplesClosed2)
            {
                return AllocationChoice.Triples;
            }

            // Priority 3: Close Doubles/Triples even if can't score
            if (dart.Multiplier == 2 && options.IncludeDoubles && !doublesClosedByMe2)
            {
                return AllocationChoice.Doubles;
            }
            if (dart.Multiplier == 3 && options.IncludeTriples && !triplesClosedByMe2)
            {
                return AllocationChoice.Triples;
            }

            // Everything closed - skip
            return AllocationChoice.Skip;
        }
    }
}