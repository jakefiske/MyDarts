import { useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const API_URL = '/api/throwsource';
const HUB_URL = '/gamehub';

export interface ThrowSource {
  sourceId: string;
  displayName: string;
  status: string;
  isActive: boolean;
  isAvailable: boolean;
}

export interface ThrowSourceStatus {
  activeSource: {
    sourceId: string;
    displayName: string;
    status: string;
  } | null;
  boundGameId: string | null;
  dartsCallerUrl: string | null;
}

export interface DartDetectedEvent {
  segment: string;
  value: number;
  multiplier: number;
  dartNumber: number;
  confidence?: number;
  timestamp: string;
}

export interface ThrowSourceEventHandlers {
  onDartDetected?: (event: DartDetectedEvent) => void;
  onTakeoutDetected?: () => void;
  onStatusChanged?: (status: string, message?: string) => void;
}

export function useThrowSource(handlers: ThrowSourceEventHandlers = {}) {
  const [sources, setSources] = useState<ThrowSource[]>([]);
  const [status, setStatus] = useState<ThrowSourceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const handlersRef = useRef(handlers);

  // Update handlers ref
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Fetch available sources
  const fetchSources = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setSources(data.sources);
      setStatus({
        activeSource: data.activeSourceId ? {
          sourceId: data.activeSourceId,
          displayName: data.sources.find((s: ThrowSource) => s.sourceId === data.activeSourceId)?.displayName || '',
          status: data.sources.find((s: ThrowSource) => s.sourceId === data.activeSourceId)?.status || ''
        } : null,
        boundGameId: data.boundGameId,
        dartsCallerUrl: null
      });
    } catch (err) {
      setError('Failed to fetch throw sources');
      console.error('Error fetching sources:', err);
    }
  }, []);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  }, []);

  // Configure autodarts URL
  const configureUrl = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/autodarts/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to configure URL');
      }
      await fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to configure URL';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  // Activate a source
  const activateSource = useCallback(async (sourceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/${sourceId}/activate`, {
        method: 'POST'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to activate source');
      }
      await fetchSources();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate source';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSources]);

  // Deactivate current source
  const deactivate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetch(`${API_URL}/deactivate`, { method: 'POST' });
      await fetchSources();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSources]);

  // Bind to a game
  const bindToGame = useCallback(async (gameId: string) => {
    try {
      const response = await fetch(`${API_URL}/bind/${gameId}`, {
        method: 'POST'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to bind to game');
      }
      await fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bind to game';
      setError(message);
      throw err;
    }
  }, [fetchStatus]);

  // Unbind from game
  const unbind = useCallback(async () => {
    try {
      await fetch(`${API_URL}/unbind`, { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error('Error unbinding:', err);
    }
  }, [fetchStatus]);

  // Setup SignalR connection for real-time events
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Listen for throw source events
    connection.on('DartDetected', (event: DartDetectedEvent) => {
      console.log('DartDetected:', event);
      handlersRef.current.onDartDetected?.(event);
    });

    connection.on('TakeoutDetected', () => {
      console.log('TakeoutDetected');
      handlersRef.current.onTakeoutDetected?.();
    });

    connection.on('ThrowSourceStatus', (data: { status: string; message?: string }) => {
      console.log('ThrowSourceStatus:', data);
      handlersRef.current.onStatusChanged?.(data.status, data.message);
      fetchStatus();
    });

    connection.on('ThrowSourceActivated', () => {
      fetchSources();
    });

    connection.on('ThrowSourceDeactivated', () => {
      fetchSources();
    });

    connection.on('ThrowSourceBound', () => {
      fetchStatus();
    });

    connection.on('ThrowSourceUnbound', () => {
      fetchStatus();
    });

    connection.start().catch(err => {
      console.error('SignalR connection failed:', err);
    });

    return () => {
      connection.stop();
    };
  }, [fetchSources, fetchStatus]);

  // Initial fetch
  useEffect(() => {
    fetchSources();
    fetchStatus();
  }, [fetchSources, fetchStatus]);

  return {
    sources,
    status,
    isLoading,
    error,
    configureUrl,
    activateSource,
    deactivate,
    bindToGame,
    unbind,
    refetch: fetchSources
  };
}