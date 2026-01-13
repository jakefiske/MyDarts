import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useTheme } from '../hooks/useThemeContext';

interface AutodartsBridgeProps {}

enum BridgeStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

const API_BASE = process.env.REACT_APP_API_URL || '';

export const AutodartsBridge: React.FC<AutodartsBridgeProps> = () => {
  const { theme } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<BridgeStatus>(BridgeStatus.DISCONNECTED);
  const [lastThrow, setLastThrow] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  
  const [dartsCallerUrl, setDartsCallerUrl] = useState(() => 
    localStorage.getItem('dartscaller_url') || 'https://localhost:8079'
  );
  const [showSettings, setShowSettings] = useState(false);

  const hubConnectionRef = useRef<HubConnection | null>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const saveSettings = () => {
    if (!dartsCallerUrl.trim()) {
      addLog('❌ URL is required');
      return;
    }
    localStorage.setItem('dartscaller_url', dartsCallerUrl);
    setShowSettings(false);
    addLog('✅ Settings saved');
  };

  // Setup SignalR connection to listen for darts-caller events from backend
  useEffect(() => {
    const hubUrl = `${API_BASE}/gamehub`;
    
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // Listen for throw events from darts-caller (via backend)
    connection.on('DartsCallerThrow', (data: any) => {
      const { segment, multiplier } = data;
      const throwStr = formatThrow(segment, multiplier);
      setLastThrow(throwStr);
      addLog(`🎯 Throw: ${throwStr}`);
    });

    // Listen for status updates
    connection.on('DartsCallerStatus', (data: any) => {
      const { status: newStatus, message } = data;
      addLog(`📡 Status: ${newStatus}${message ? ` - ${message}` : ''}`);
      
      if (newStatus === 'connected') {
        setStatus(BridgeStatus.CONNECTED);
      } else if (newStatus === 'disconnected') {
        setStatus(BridgeStatus.DISCONNECTED);
      } else if (newStatus === 'error') {
        setStatus(BridgeStatus.ERROR);
      }
    });

    // Listen for raw events (for debugging)
    connection.on('DartsCallerEvent', (data: any) => {
      console.log('DartsCallerEvent:', data);
    });

    connection.start()
      .then(() => {
        console.log('SignalR connected for darts-caller events');
      })
      .catch(err => {
        console.error('SignalR connection failed:', err);
      });

    hubConnectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [addLog]);

  const formatThrow = (segment: string, multiplier: number): string => {
    if (segment === '25') {
      return multiplier === 2 ? 'DB' : 'SB';
    }
    if (segment === '0' || segment === 'MISS') {
      return 'MISS';
    }
    const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';
    return `${prefix}${segment}`;
  };

  const connectToBackend = async () => {
    try {
      addLog('🔌 Connecting via backend...');
      setStatus(BridgeStatus.CONNECTING);

      const response = await fetch(`${API_BASE}/api/dartscaller/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: dartsCallerUrl })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Connection failed');
      }

      addLog('✅ Connected to darts-caller');
      setStatus(BridgeStatus.CONNECTED);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setStatus(BridgeStatus.ERROR);
    }
  };

  const disconnectFromBackend = async () => {
    try {
      await fetch(`${API_BASE}/api/dartscaller/disconnect`, {
        method: 'POST'
      });
      addLog('👋 Disconnected');
      setStatus(BridgeStatus.DISCONNECTED);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const toggleBridge = async () => {
    if (enabled) {
      await disconnectFromBackend();
      setEnabled(false);
    } else {
      setEnabled(true);
      await connectToBackend();
    }
  };

  // Check initial status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/dartscaller/status`);
        const data = await response.json();
        
        if (data.connected) {
          setEnabled(true);
          setStatus(BridgeStatus.CONNECTED);
          addLog('✅ Already connected to darts-caller');
        }
      } catch (error) {
        // Backend not reachable, that's fine
      }
    };
    
    checkStatus();
  }, [addLog]);

  return (
    <div className="p-4 rounded-xl" 
         style={{ 
           background: enabled ? `${theme.stateColors.active.color}22` : theme.backgrounds.cardHex,
           border: `2px solid ${enabled ? theme.stateColors.active.border : theme.borders.primary}` 
         }}>
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-sm" style={{ color: theme.text.primary }}>
            📷 Darts-Caller Bridge
          </div>
          <div className="text-xs mt-1" style={{ color: theme.text.secondary }}>
            {status === BridgeStatus.CONNECTED ? '✅ Connected (via backend)' : 
             status === BridgeStatus.CONNECTING ? '🔄 Connecting...' : 
             status === BridgeStatus.ERROR ? '❌ Error' : 
             '⚪ Disconnected'}
            {lastThrow && ` • Last: ${lastThrow}`}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg"
            style={{ 
              background: theme.backgrounds.baseHex,
              color: theme.text.primary 
            }}
            title="Configure darts-caller URL"
          >
            ⚙️
          </button>
          
          <button
            onClick={toggleBridge}
            className="relative w-14 h-8 rounded-full transition-all"
            style={{ 
              background: enabled ? theme.stateColors.active.color : theme.backgrounds.baseHex,
            }}
            title={enabled ? 'Disable cameras' : 'Enable cameras'}
          >
            <div
              className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
              style={{ left: enabled ? '30px' : '4px' }}
            />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-3 p-4 rounded-lg space-y-3" 
             style={{ background: theme.backgrounds.baseHex }}>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: theme.text.secondary }}>
              Darts-Caller URL
            </label>
            <input
              type="text"
              value={dartsCallerUrl}
              onChange={(e) => setDartsCallerUrl(e.target.value)}
              placeholder="https://localhost:8079"
              className="w-full px-3 py-2 rounded text-sm font-mono"
              style={{ 
                background: theme.backgrounds.cardHex,
                color: theme.text.primary,
                border: `1px solid ${theme.borders.primary}`
              }}
            />
            <div className="text-xs mt-1" style={{ color: theme.text.muted }}>
              Backend connects to darts-caller (bypasses browser SSL issues)
            </div>
          </div>

          <button
            onClick={saveSettings}
            className="w-full py-2 rounded-lg font-bold text-sm"
            style={{ 
              background: theme.stateColors.active.color,
              color: theme.backgrounds.baseHex 
            }}
          >
            Save Settings
          </button>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold" style={{ color: theme.text.secondary }}>
              Activity Log
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-xs px-2 py-1 rounded"
              style={{ background: theme.backgrounds.baseHex, color: theme.text.secondary }}
            >
              Clear
            </button>
          </div>
          <div className="p-3 rounded-lg h-32 overflow-y-auto text-xs font-mono space-y-1" 
               style={{ background: theme.backgrounds.baseHex }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ color: theme.text.secondary }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
