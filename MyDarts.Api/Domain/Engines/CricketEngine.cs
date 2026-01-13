using MyDarts.Api.Models.Entities;
using MyDarts.Api.Models.Entities.GameData;
using MyDarts.Api.Models.Enums;
using MyDarts.Api.Models.Requests;

namespace MyDarts.Api.Domain.Engines
{
    public class CricketEngine : BaseGameEngine
    {
        public override GameType GameType => GameType.Cricket;
        public override string DisplayName => "Cricket";
        public override string Description => "Close 20-15 and Bull. Score points when closed before opponent!";

        private static readonly int[] CricketNumbers = { 20, 19, 18, 17, 16, 15, 25 }; // Bull is 25

        protected override int GetStartingPosition() => 0;

        protected override Player CreatePlayer(string name, CreateGameRequest? options = null)
        {
            var player = new Player
            {
                Id = Guid.NewGuid().ToString(),
                Name = name,
                Position = 0,
                Score = 0,
                IsWinner = false
            };

            player.SetGameData(new CricketPlayerData());

            return player;
        }

        protected override void InitializeGame(GameState game, CreateGameRequest? options = null)
        {
            // Data already set in CreatePlayer
        }

        protected override ThrowResult ProcessPlayerThrow(GameState game, Player player, DartThrow dart)
        {
            var playerData = player.GetGameData<CricketPlayerData>();
            if (playerData == null)
            {
                playerData = new CricketPlayerData();
                player.SetGameData(playerData);
            }

            string message = "";
            bool wasHit = false;

            // Only process if it's a cricket number
            if (CricketNumbers.Contains(dart.Value))
            {
                wasHit = true;
                int marksToAdd = dart.Multiplier;
                int currentMarks = playerData.GetMarks(dart.Value);
                int newMarks = currentMarks + marksToAdd;

                playerData.Marks[dart.Value] = newMarks;

                if (newMarks >= 3)
                {
                    bool opponentHasClosed = game.Players
                        .Where(p => p.Id != player.Id)
                        .All(p =>
                        {
                            var oppData = p.GetGameData<CricketPlayerData>();
                            return oppData != null && oppData.IsNumberClosed(dart.Value);
                        });

                    if (!opponentHasClosed && newMarks > 3)
                    {
                        int pointsToAdd = (newMarks - 3) * dart.Value;
                        playerData.Score += pointsToAdd;
                        player.Score = playerData.Score;
                        message = $"+{pointsToAdd} points on {GetNumberDisplay(dart.Value)}!";
                    }
                    else if (newMarks == 3)
                    {
                        message = $"{GetNumberDisplay(dart.Value)} closed!";
                    }
                    else
                    {
                        message = $"{GetNumberDisplay(dart.Value)} already closed by opponent";
                    }
                }
                else
                {
                    string markSymbol = newMarks == 1 ? "/" : "X";
                    message = $"{markSymbol} on {GetNumberDisplay(dart.Value)}";
                }
            }
            else
            {
                message = "Not a cricket number";
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
            var playerData = player.GetGameData<CricketPlayerData>();
            if (playerData == null || !playerData.AllNumbersClosed())
                return false;

            // In single player, just need to close all numbers
            if (game.Players.Count == 1)
                return true;

            // In multiplayer, need highest score AND all numbers closed
            var allPlayerScores = game.Players
                .Select(p => p.GetGameData<CricketPlayerData>()?.Score ?? 0)
                .ToList();

            var maxScore = allPlayerScores.Max();

            // Win if you have all closed AND (highest score OR tied for highest)
            return playerData.Score >= maxScore;
        }

        protected override string GetTargetDisplay(Player player)
        {
            var playerData = player.GetGameData<CricketPlayerData>();
            if (playerData == null)
                return "20";

            // Find first unclosed number
            foreach (var number in CricketNumbers)
            {
                if (!playerData.IsNumberClosed(number))
                {
                    return GetNumberDisplay(number);
                }
            }

            return "All Closed";
        }

        protected override bool ShouldEndTurn(GameState game, ThrowResult result)
        {
            // Cricket always ends turn after 3 darts (no streak bonus)
            return game.ThrowsThisTurn >= 3;
        }

        private string GetNumberDisplay(int value)
        {
            return value == 25 ? "Bull" : value.ToString();
        }
    }
}