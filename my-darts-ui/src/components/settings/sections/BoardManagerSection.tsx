import React, { useState } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

export const BoardManagerSection: React.FC = () => {
  const { theme } = useTheme();
  const [boardManagerUrl, setBoardManagerUrl] = useState(() => {
    return localStorage.getItem('boardManagerUrl') || 'http://192.168.86.25:3180';
  });

  const handleSaveUrl = () => {
    localStorage.setItem('boardManagerUrl', boardManagerUrl);
  };

  const handleLaunch = () => {
    window.open(boardManagerUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Board Setup</h2>
      
      <div className="p-6 rounded-lg text-center" style={{ background: theme.backgrounds.cardHex }}>
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: theme.text.primary }}>
          Board Manager
        </h3>
        <p className="mb-6" style={{ color: theme.text.muted }}>
          Configure cameras, calibrate board, and manage Autodarts settings
        </p>
        <button
          onClick={handleLaunch}
          className="px-8 py-4 rounded-lg font-bold text-lg"
          style={{ 
            background: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
            color: 'white'
          }}
        >
          🔧 Open Board Manager
        </button>
      </div>

      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Board Manager URL</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={boardManagerUrl}
            onChange={(e) => setBoardManagerUrl(e.target.value)}
            placeholder="http://192.168.86.25:3180"
            className="flex-1 px-3 py-2 rounded-lg"
            style={{ 
              background: theme.backgrounds.baseHex, 
              color: theme.text.primary, 
              border: `1px solid ${theme.borders.secondary}` 
            }}
          />
          <button
            onClick={handleSaveUrl}
            className="px-4 py-2 rounded-lg font-bold"
            style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex }}
          >
            Save
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: theme.text.muted }}>
          The IP address where your Autodarts board manager is running
        </p>
      </div>
    </div>
  );
};