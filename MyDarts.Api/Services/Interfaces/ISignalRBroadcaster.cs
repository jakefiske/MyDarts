using MyDarts.Api.Domain.Events;

namespace MyDarts.Api.Services.Interfaces
{
    public interface ISignalRBroadcaster
    {
        Task BroadcastEventAsync(GameEvent gameEvent);
    }
}