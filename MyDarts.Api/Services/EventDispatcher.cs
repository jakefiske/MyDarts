using MyDarts.Api.Domain.Events;
using MyDarts.Api.Services.Interfaces;

namespace MyDarts.Api.Services
{
    public class EventDispatcher : IEventDispatcher
    {
        private readonly ILogger<EventDispatcher> _logger;
        private readonly ISignalRBroadcaster? _signalRBroadcaster;
        private readonly Dictionary<Type, List<Func<GameEvent, Task>>> _handlers = new();

        // Constructor with optional SignalR broadcaster for testing/flexibility
        public EventDispatcher(
            ILogger<EventDispatcher> logger,
            ISignalRBroadcaster? signalRBroadcaster = null)
        {
            _logger = logger;
            _signalRBroadcaster = signalRBroadcaster;
        }

        public async Task DispatchAsync(IEnumerable<GameEvent> events)
        {
            foreach (var evt in events)
            {
                _logger.LogDebug("Dispatching event: {EventType} for game {GameId}",
                    evt.GetType().Name, evt.GameId);

                // Broadcast via SignalR if available
                if (_signalRBroadcaster != null)
                {
                    try
                    {
                        await _signalRBroadcaster.BroadcastEventAsync(evt);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to broadcast event via SignalR: {EventType}",
                            evt.GetType().Name);
                    }
                }

                // Call registered handlers
                if (_handlers.TryGetValue(evt.GetType(), out var handlers))
                {
                    foreach (var handler in handlers)
                    {
                        try
                        {
                            await handler(evt);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error handling event {EventType}", evt.GetType().Name);
                        }
                    }
                }
            }
        }

        public void Subscribe<T>(Func<T, Task> handler) where T : GameEvent
        {
            var eventType = typeof(T);
            if (!_handlers.ContainsKey(eventType))
                _handlers[eventType] = new List<Func<GameEvent, Task>>();

            _handlers[eventType].Add(e => handler((T)e));
        }
    }
}