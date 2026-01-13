using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;

namespace MyDarts.Api.Domain.Engines
{
    public class X01Engine : BaseGameEngine
    {
        public override GameType GameType => GameType.X01;
        public override string DisplayName => "X01";
        public override string Description => "Classic 301/501/701 - double out to win!";

        private const int DefaultStartingScore = 501;

        protected override int GetStartingPosition() => 0;

        protected override Player CreatePlayer(string name, CreateGameRequest? options = null)
        {
            var startingScore = options?.StartingScore ?? DefaultStartingScore;
            var doubleIn = options?.DoubleIn ?? false;

            var player = new Player
            {
                Id = Guid.NewGuid().ToString(),
                Name = name,
                Position = 0,
                Score = startingScore,
                IsWinner = false
            };

            player.SetGameData(new X01PlayerData
            {
                StartingScore = startingScore,
                DoubleInRequired = doubleIn,
                HasDoubledIn = !doubleIn,
                TurnStartScore = startingScore
            });

            return player;
        }

        protected override void InitializeGame(GameState game, CreateGameRequest? options = null)
        {
            // Game-level settings could be stored here if needed
        }

        protected override ThrowResult ProcessPlayerThrow(GameState game, Player player, DartThrow dart)
        {
            var data = player.GetGameData<X01PlayerData>();
            if (data == null)
            {
                // Fallback for legacy data
                data = new X01PlayerData { StartingScore = 501, HasDoubledIn = true };
                player.SetGameData(data);
            }

            if (game.ThrowsThisTurn == 0)
            {
                data.TurnStartScore = player.Score;
                player.SetGameData(data); // Persist the change
            }

            var throwScore = dart.Value * dart.Multiplier;

            // Check for double-in requirement
            if (!data.HasDoubledIn)
            {
                if (dart.Multiplier == 2)
                {
                    data.HasDoubledIn = true;
                    player.SetGameData(data);
                }
                else
                {
                    return new ThrowResult
                    {
                        WasHit = false,
                        Message = "Need DOUBLE to start!"
                    };
                }
            }

            var newScore = player.Score - throwScore;

            // Check for bust
            if (newScore < 0 || newScore == 1)
            {
                player.Score = data.TurnStartScore;
                game.TurnComplete = true;

                return new ThrowResult
                {
                    WasHit = false,
                    Message = "BUST!"
                };
            }

            // Check for win
            if (newScore == 0)
            {
                if (dart.Multiplier == 2)
                {
                    player.Score = 0;
                    return new ThrowResult
                    {
                        WasHit = true,
                        Message = "CHECKOUT!"
                    };
                }
                else
                {
                    player.Score = data.TurnStartScore;
                    game.TurnComplete = true;

                    return new ThrowResult
                    {
                        WasHit = false,
                        Message = "BUST! Must finish on a double"
                    };
                }
            }

            player.Score = newScore;
            return new ThrowResult
            {
                WasHit = true,
                PositionAdvance = throwScore
            };
        }

        protected override bool CheckWinCondition(GameState game, Player player)
        {
            return player.Score == 0;
        }

        protected override bool ShouldEndTurn(GameState game, ThrowResult result)
        {
            if (game.TurnComplete) return false;
            return game.ThrowsThisTurn >= 3;
        }

        protected override string GetTargetDisplay(Player player)
        {
            return player.Score.ToString();
        }

        public string? GetCheckoutSuggestion(Player player)
        {
            return CheckoutChart.GetCheckout(player.Score);
        }

        public bool RequiresDoubleIn(Player player)
        {
            var data = player.GetGameData<X01PlayerData>();
            return data != null && data.DoubleInRequired && !data.HasDoubledIn;
        }
    }
}