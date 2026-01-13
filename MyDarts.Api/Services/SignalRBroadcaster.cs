using Microsoft.AspNetCore.SignalR;
using MyDarts.Api.Domain.Events;
using MyDarts.Api.Hubs;
using MyDarts.Api.Services.Interfaces;

namespace MyDarts.Api.Services
{
    /// <summary>
    /// Service that broadcasts game events to connected SignalR clients
    /// </summary>

    public class SignalRBroadcaster : ISignalRBroadcaster
    {
        private readonly IHubContext<GameHub> _hubContext;
        private readonly ILogger<SignalRBroadcaster> _logger;

        public SignalRBroadcaster(
            IHubContext<GameHub> hubContext,
            ILogger<SignalRBroadcaster> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task BroadcastEventAsync(GameEvent gameEvent)
        {
            var gameGroup = $"game_{gameEvent.GameId}";
            var eventType = gameEvent.GetType().Name;

            try
            {
                // Send to all clients subscribed to this game
                await _hubContext.Clients.Group(gameGroup).SendAsync(eventType, gameEvent);

                _logger.LogDebug("Broadcasted {EventType} to game group {GameGroup}",
                    eventType, gameGroup);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast {EventType} for game {GameId}",
                    eventType, gameEvent.GameId);
            }
        }
    }
}