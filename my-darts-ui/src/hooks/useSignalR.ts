import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export enum ConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Reconnecting = 'Reconnecting',
}

interface GameEvent {
  gameId: string;
  occurredAt: string;
}

interface DartThrownEvent extends GameEvent {
  playerId: string;
  playerName: string;
  segment: string;
  value: number;
  multiplier: number;
  wasHit: boolean;
  throwNumberInTurn: number;
}

interface GameWonEvent extends GameEvent {
  winnerId: string;
  winnerName: string;
  totalThrows: number;
}

interface StreakStartedEvent extends GameEvent {
  playerId: string;
  playerName: string;
  consecutiveHits: number;
}

interface TurnEndedEvent extends GameEvent {
  playerId: string;
  playerName: string;
  nextPlayerId: string;
  nextPlayerName: string;
  totalThrowsInTurn: number;
  hitsInTurn: number;
}

export interface SignalREventHandlers {
  onDartThrown?: (event: DartThrownEvent) => void;
  onGameWon?: (event: GameWonEvent) => void;
  onStreakStarted?: (event: StreakStartedEvent) => void;
  onTurnEnded?: (event: TurnEndedEvent) => void;
  onTakeoutDetected?: () => void;
}

const HUB_URL = '/gamehub';

export function useSignalR(gameId: string | null, handlers: SignalREventHandlers = {}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const handlersRef = useRef(handlers);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    // Don't connect if no game ID
    if (!gameId) {
      return;
    }

    // Create connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
      setConnectionState(ConnectionState.Reconnecting);
    });

    connection.onreconnected(() => {
      console.log('SignalR reconnected');
      setConnectionState(ConnectionState.Connected);
      
      // Re-subscribe to game after reconnection
      connection.invoke('SubscribeToGame', gameId).catch(err => {
        console.error('Failed to re-subscribe to game:', err);
      });
    });

    connection.onclose(() => {
      console.log('SignalR connection closed');
      setConnectionState(ConnectionState.Disconnected);
    });

    // Register event handlers
    connection.on('DartThrownEvent', (event: DartThrownEvent) => {
      console.log('DartThrownEvent received:', event);
      handlersRef.current.onDartThrown?.(event);
    });

    connection.on('GameWonEvent', (event: GameWonEvent) => {
      console.log('GameWonEvent received:', event);
      handlersRef.current.onGameWon?.(event);
    });

    connection.on('StreakStartedEvent', (event: StreakStartedEvent) => {
      console.log('StreakStartedEvent received:', event);
      handlersRef.current.onStreakStarted?.(event);
    });

    connection.on('TurnEndedEvent', (event: TurnEndedEvent) => {
      console.log('TurnEndedEvent received:', event);
      handlersRef.current.onTurnEnded?.(event);
    });

    connection.on('TakeoutDetected', () => {
      console.log('TakeoutDetected received');
      handlersRef.current.onTakeoutDetected?.();
    });

    // Start connection
    const startConnection = async () => {
      try {
        setConnectionState(ConnectionState.Connecting);
        await connection.start();
        console.log('SignalR connected');
        setConnectionState(ConnectionState.Connected);
        
        // Subscribe to this game's events
        await connection.invoke('SubscribeToGame', gameId);
        console.log('Subscribed to game:', gameId);
      } catch (err) {
        console.error('SignalR connection failed:', err);
        setConnectionState(ConnectionState.Disconnected);
      }
    };

    startConnection();

    // Cleanup
    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(err => {
          console.error('Error stopping SignalR connection:', err);
        });
      }
    };
  }, [gameId]);

  const isConnected = connectionState === ConnectionState.Connected;

  return {
    connectionState,
    isConnected,
  };
}
