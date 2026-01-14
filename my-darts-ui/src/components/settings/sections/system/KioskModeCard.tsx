import React from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';

export const KioskModeCard: React.FC = () => {
  const { theme } = useTheme();

  const handleExitKiosk = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    window.close();
  };

  return (
    <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
      <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Kiosk Mode</h3>
      <p className="mb-4 text-sm" style={{ color: theme.text.muted }}>
        Exit fullscreen kiosk mode to access other applications
      </p>
      <button
        onClick={handleExitKiosk}
        className="w-full py-3 rounded-lg font-bold"
        style={{ 
          background: '#e74c3c',
          color: 'white'
        }}
      >
        🚪 Exit Kiosk Mode
      </button>
      <p className="text-xs mt-2 text-center" style={{ color: theme.text.muted }}>
        Or press Alt+F4 to exit
      </p>
    </div>
  );
};