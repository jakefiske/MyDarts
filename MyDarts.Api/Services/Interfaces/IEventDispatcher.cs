using MyDarts.Api.Domain.Events;

namespace MyDarts.Api.Services.Interfaces
{
    public interface IEventDispatcher
    {
        Task DispatchAsync(IEnumerable<GameEvent> events);
        void Subscribe<T>(Func<T, Task> handler) where T : GameEvent;
    }
}