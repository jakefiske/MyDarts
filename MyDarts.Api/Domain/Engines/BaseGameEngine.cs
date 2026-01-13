using MyDarts.Api.Domain.Events;
using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;

namespace MyDarts.Api.Domain.Engines
{
    public abstract class BaseGameEngine : IGameEngine
    {
        public abstract GameType GameType { get; }
        public abstract string DisplayName { get; }
        public abstract string Description { get; }

        public GameState CreateGame(List<string> playerNames, CreateGameRequest? options = null)
        {
            var game = new GameState
            {
                GameId = Guid.NewGuid().ToString(),
                GameType = GameType,
                Status = GameStatus.InProgress,
                Players = playerNames.Select(name => CreatePlayer(name, options)).ToList(),
                CurrentPlayerIndex = 0,
                ThrowsThisTurn = 0,
                ConsecutiveHits = 0,
                TurnComplete = false,
                StartedAt = DateTime.UtcNow
            };

            InitializeGame(game, options);
            return game;
        }

        protected virtual Player CreatePlayer(string name, CreateGameRequest? options = null)
        {
            return new Player
            {
                Id = Guid.NewGuid().ToString(),
                Name = name,
                Position = GetStartingPosition(),
                IsWinner = false
            };
        }

        protected abstract int GetStartingPosition();
        protected abstract void InitializeGame(GameState game, CreateGameRequest? options = null);
        protected abstract ThrowResult ProcessPlayerThrow(GameState game, Player player, DartThrow dart);
        protected abstract bool CheckWinCondition(GameState game, Player player);
        protected abstract string GetTargetDisplay(Player player);

        public (GameState game, List<GameEvent> events) ProcessThrow(GameState game, DartThrow dart)
        {
            var events = new List<GameEvent>();
            var player = game.CurrentPlayer;
            if (player == null) return (game, events);

            var result = ProcessPlayerThrow(game, player, dart);

            // Store the message for UI
            game.LastThrowMessage = result.Message;

            player.Throws.Add(dart.Segment);
            game.ThrowsThisTurn++;

            if (result.WasHit)
            {
                game.ConsecutiveHits++;
                if (game.ConsecutiveHits == 3)
                {
                    events.Add(new StreakStartedEvent
                    {
                        GameId = game.GameId,
                        PlayerId = player.Id,
                        PlayerName = player.Name,
                        ConsecutiveHits = game.ConsecutiveHits
                    });
                }
            }
            else
            {
                game.ConsecutiveHits = 0;
            }

            events.Add(new DartThrownEvent
            {
                GameId = game.GameId,
                PlayerId = player.Id,
                PlayerName = player.Name,
                Segment = dart.Segment,
                Value = dart.Value,
                Multiplier = dart.Multiplier,
                WasHit = result.WasHit,
                ThrowNumberInTurn = game.ThrowsThisTurn
            });

            if (CheckWinCondition(game, player))
            {
                player.IsWinner = true;
                game.Status = GameStatus.Complete;
                game.CompletedAt = DateTime.UtcNow;

                events.Add(new GameWonEvent
                {
                    GameId = game.GameId,
                    WinnerId = player.Id,
                    WinnerName = player.Name,
                    TotalThrows = player.Throws.Count
                });

                return (game, events);
            }

            if (ShouldEndTurn(game, result))
            {
                game.TurnComplete = true;
            }

            return (game, events);
        }

        protected virtual bool ShouldEndTurn(GameState game, ThrowResult result)
        {
            if (game.ThrowsThisTurn < 3) return false;
            if (game.ConsecutiveHits >= 3 && result.WasHit) return false;
            return true;
        }

        public string GetCurrentTargetDisplay(Player player)
        {
            return GetTargetDisplay(player);
        }
    }
}