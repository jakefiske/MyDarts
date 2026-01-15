import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../hooks/useThemeContext';
import { useThrowSource } from '../hooks/useThrowSource';
import { getDefaultDartsCallerUrl } from '../config';

interface AutodartsBridgeProps {}

export const AutodartsBridge: React.FC<AutodartsBridgeProps> = () => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [urlInput, setUrlInput] = useState(() => getDefaultDartsCallerUrl());

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const {
    status,
    isLoading,
    error,
    configureUrl,
    activateSource,
    deactivate
  } = useThrowSource({
    onDartDetected: (event) => {
      addLog(`🎯 Dart ${event.dartNumber}: ${event.segment}`);
    },
    onTakeoutDetected: () => {
      addLog('🔄 Darts pulled');
    },
    onStatusChanged: (newStatus, message) => {
      addLog(`📡 ${newStatus}${message ? `: ${message}` : ''}`);
    }
  });

  const isConnected = status?.activeSource?.sourceId === 'autodarts' && 
                      status?.activeSource?.status === 'Connected';
  const isConnecting = status?.activeSource?.status === 'Connecting';

  // Log errors
  useEffect(() => {
    if (error) {
      addLog(`❌ ${error}`);
    }
  }, [error, addLog]);

  const saveSettings = async () => {
    if (!urlInput.trim()) {
      addLog('❌ URL is required');
      return;
    }
    
    try {
      localStorage.setItem('dartscaller_url', urlInput);
      await configureUrl(urlInput);
      setShowSettings(false);
      addLog('✅ Settings saved');
    } catch {
      // Error handled by hook
    }
  };

  const toggleBridge = async () => {
    if (isConnected) {
      await deactivate();
      addLog('👋 Disconnected');
    } else {
      // Configure URL first if needed
      const savedUrl = localStorage.getItem('dartscaller_url');
      if (savedUrl && savedUrl !== status?.dartsCallerUrl) {
        await configureUrl(savedUrl);
      }
      
      try {
        addLog('🔌 Connecting...');
        await activateSource('autodarts');
        addLog('✅ Connected');
      } catch {
        // Error handled by hook
      }
    }
  };

  const getStatusDisplay = () => {
    if (isConnecting || isLoading) return '🔄 Connecting...';
    if (isConnected) return '✅ Connected';
    if (error) return '❌ Error';
    return '⚪ Disconnected';
  };

  return (
    <div className="p-4 rounded-xl" 
         style={{ 
           background: isConnected ? `${theme.stateColors.active.color}22` : theme.backgrounds.cardHex,
           border: `2px solid ${isConnected ? theme.stateColors.active.border : theme.borders.primary}` 
         }}>
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-sm" style={{ color: theme.text.primary }}>
            📷 Darts-Caller Bridge
          </div>
          <div className="text-xs mt-1" style={{ color: theme.text.secondary }}>
            {getStatusDisplay()}
            {status?.dartsCallerUrl && (
              <span className="ml-2 opacity-60">• {status.dartsCallerUrl}</span>
            )}
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
            disabled={isLoading || isConnecting}
            className="relative w-14 h-8 rounded-full transition-all disabled:opacity-50"
            style={{ 
              background: isConnected ? theme.stateColors.active.color : theme.backgrounds.baseHex,
            }}
            title={isConnected ? 'Disable cameras' : 'Enable cameras'}
          >
            <div
              className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
              style={{ left: isConnected ? '30px' : '4px' }}
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
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:8079"
              className="w-full px-3 py-2 rounded text-sm font-mono"
              style={{ 
                background: theme.backgrounds.cardHex,
                color: theme.text.primary,
                border: `1px solid ${theme.borders.primary}`
              }}
            />
            <div className="text-xs mt-1" style={{ color: theme.text.muted }}>
              Darts-caller runs on the same device as MyDarts (use localhost:8079)
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={isLoading}
            className="w-full py-2 rounded-lg font-bold text-sm disabled:opacity-50"
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