using Microsoft.AspNetCore.SignalR;
using MyDarts.Api.Domain.Events;

namespace MyDarts.Api.Hubs
{
    /// <summary>
    /// SignalR hub for real-time game updates
    /// Clients can subscribe to specific games to receive live event broadcasts
    /// </summary>
    public class GameHub : Hub
    {
        private readonly ILogger<GameHub> _logger;

        public GameHub(ILogger<GameHub> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Subscribe client to a specific game's events
        /// </summary>
        public async Task SubscribeToGame(string gameId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetGameGroup(gameId));
            _logger.LogInformation("Client {ConnectionId} subscribed to game {GameId}",
                Context.ConnectionId, gameId);
        }

        /// <summary>
        /// Unsubscribe client from a game's events
        /// </summary>
        public async Task UnsubscribeFromGame(string gameId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGameGroup(gameId));
            _logger.LogInformation("Client {ConnectionId} unsubscribed from game {GameId}",
                Context.ConnectionId, gameId);
        }

        /// <summary>
        /// Get the SignalR group name for a specific game
        /// </summary>
        private static string GetGameGroup(string gameId) => $"game_{gameId}";

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}