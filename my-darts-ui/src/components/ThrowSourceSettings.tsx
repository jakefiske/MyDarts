import React, { useState } from 'react';
import { useThrowSource } from '../hooks/useThrowSource';

interface ThrowSourceSettingsProps {
  className?: string;
}

export const ThrowSourceSettings: React.FC<ThrowSourceSettingsProps> = ({ className }) => {
  const {
    sources,
    status,
    isLoading,
    error,
    configureUrl,
    activateSource,
    deactivate
  } = useThrowSource();

  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleConfigureUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      await configureUrl(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
    } catch {
      // Error is handled by the hook
    }
  };

  const handleActivate = async (sourceId: string) => {
    try {
      await activateSource(sourceId);
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Camera Detection</h3>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Current Status */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="text-sm text-gray-400 mb-1">Status</div>
        {status?.activeSource ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-green-400 font-medium">{status.activeSource.displayName}</span>
              <span className="text-gray-500 ml-2">({status.activeSource.status})</span>
            </div>
            <button
              onClick={deactivate}
              disabled={isLoading}
              className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <span className="text-gray-500">No source connected</span>
        )}
        
        {status?.boundGameId && (
          <div className="text-sm text-gray-400 mt-2">
            Bound to game: <span className="text-blue-400">{status.boundGameId}</span>
          </div>
        )}
      </div>

      {/* Available Sources */}
      <div className="space-y-2">
        {sources.map(source => (
          <div
            key={source.sourceId}
            className="flex items-center justify-between p-3 bg-gray-800 rounded"
          >
            <div>
              <div className="font-medium">{source.displayName}</div>
              <div className="text-sm text-gray-500">
                {source.isAvailable ? 'Available' : 'Not available'}
                {source.status !== 'Disconnected' && ` • ${source.status}`}
              </div>
            </div>
            
            {source.sourceId === 'autodarts' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Configure
                </button>
                {!source.isActive && (
                  <button
                    onClick={() => handleActivate(source.sourceId)}
                    disabled={isLoading}
                    className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                  >
                    Connect
                  </button>
                )}
              </div>
            )}
            
            {source.sourceId === 'opencv' && (
              <span className="text-sm text-gray-500">Coming soon</span>
            )}
          </div>
        ))}
      </div>

      {/* URL Configuration */}
      {showUrlInput && (
        <div className="mt-4 p-3 bg-gray-800 rounded">
          <label className="block text-sm text-gray-400 mb-2">
            darts-caller URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={status?.dartsCallerUrl || "http://localhost:8079"}
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500"
            />
            <button
              onClick={handleConfigureUrl}
              disabled={isLoading || !urlInput.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {status?.dartsCallerUrl && (
            <div className="text-sm text-gray-500 mt-2">
              Current: {status.dartsCallerUrl}
            </div>
          )}
        </div>
      )}
    </div>
  );
};