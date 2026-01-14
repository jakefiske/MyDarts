import React from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

export const AutodartsSection: React.FC = () => {
  const { theme } = useTheme();

  const handleLaunch = () => {
    window.open('https://play.autodarts.io', '_blank');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Autodarts Play</h2>
      
      <div className="p-6 rounded-lg text-center" style={{ background: theme.backgrounds.cardHex }}>
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: theme.text.primary }}>
          Autodarts.io
        </h3>
        <p className="mb-6" style={{ color: theme.text.muted }}>
          AI-powered automatic dart detection and scoring
        </p>
        <button
          onClick={handleLaunch}
          className="px-8 py-4 rounded-lg font-bold text-lg"
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          🚀 Launch Autodarts
        </button>
      </div>

      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>About</h3>
        <p className="text-sm" style={{ color: theme.text.muted }}>
          Autodarts uses cameras to automatically detect where your darts land and scores them for you. 
          Perfect for online matches and tracking your stats.
        </p>
      </div>
    </div>
  );
};