using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;

namespace MyDarts.Api.Domain.Engines
{
    public class AroundTheClockTurboEngine : BaseGameEngine
    {
        public override GameType GameType => GameType.AroundTheClockTurbo;
        public override string DisplayName => "Around the Clock - Turbo";
        public override string Description => "Hit 1-20, then doubles, triples, and bulls. Triples advance 3, doubles advance 2. Hit 3 in a row to keep throwing!";

        private static readonly List<string> Targets = new()
        {
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
            "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
            "DOUBLES", "TRIPLES", "BULL"
        };

        protected override int GetStartingPosition() => 1;

        protected override Player CreatePlayer(string name, CreateGameRequest? options = null)
        {
            var player = new Player
            {
                Id = Guid.NewGuid().ToString(),
                Name = name,
                Position = 1,
                Score = 0,
                IsWinner = false
            };

            player.SetGameData(new AroundTheClockPlayerData
            {
                CurrentTarget = 1,
                TurnStartPosition = 1
            });

            return player;
        }

        protected override void InitializeGame(GameState game, CreateGameRequest? options = null)
        {
            // Data already set in CreatePlayer
        }

        protected override ThrowResult ProcessPlayerThrow(GameState game, Player player, DartThrow dart)
        {
            var data = player.GetGameData<AroundTheClockPlayerData>();
            if (data == null)
            {
                // Fallback for legacy data
                data = new AroundTheClockPlayerData
                {
                    CurrentTarget = player.Position,
                    TurnStartPosition = player.Position
                };
                player.SetGameData(data);
            }

            if (game.ThrowsThisTurn == 0)
            {
                data.TurnStartPosition = player.Position;
                player.SetGameData(data);
            }

            var currentPosition = player.Position;
            var result = new ThrowResult { WasHit = false, PositionAdvance = 0 };

            // Positions 1-20: Hit the specific number
            if (currentPosition >= 1 && currentPosition <= 20)
            {
                if (dart.Value == currentPosition)
                {
                    var advance = dart.Multiplier; // Triple = 3, Double = 2, Single = 1
                    result.WasHit = true;
                    result.PositionAdvance = advance;
                    player.Position = Math.Min(currentPosition + advance, 23);
                }
            }
            // Position 21: DOUBLES - hit any double
            else if (currentPosition == 21)
            {
                if (dart.Multiplier == 2)
                {
                    result.WasHit = true;
                    result.PositionAdvance = 1;
                    player.Position = 22;
                }
            }
            // Position 22: TRIPLES - hit any triple
            else if (currentPosition == 22)
            {
                if (dart.Multiplier == 3)
                {
                    result.WasHit = true;
                    result.PositionAdvance = 1;
                    player.Position = 23;
                }
            }
            // Position 23: BULL - hit bull (single or double)
            else if (currentPosition == 23)
            {
                if (dart.Value == 25)
                {
                    result.WasHit = true;
                    result.PositionAdvance = 1;
                    player.Position = 24; // Winner!
                }
            }

            // Update the data
            data.CurrentTarget = player.Position;
            player.SetGameData(data);

            return result;
        }

        protected override bool CheckWinCondition(GameState game, Player player)
        {
            return player.Position >= 24;
        }

        protected override string GetTargetDisplay(Player player)
        {
            var position = player.Position;
            if (position >= 1 && position <= 20)
                return position.ToString();
            if (position == 21)
                return "DOUBLES";
            if (position == 22)
                return "TRIPLES";
            if (position == 23)
                return "BULL";
            return "🏆";
        }
    }
}