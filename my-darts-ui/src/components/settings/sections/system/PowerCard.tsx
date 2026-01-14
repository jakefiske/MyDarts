import React from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';

interface PowerCardProps {
  loading: boolean;
  onReboot: () => void;
  onShutdown: () => void;
}

export const PowerCard: React.FC<PowerCardProps> = ({ 
  loading, 
  onReboot, 
  onShutdown 
}) => {
  const { theme } = useTheme();

  return (
    <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
      <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Power</h3>
      <div className="flex gap-2">
        <button
          onClick={onReboot}
          disabled={loading}
          className="flex-1 py-3 rounded-lg font-bold"
          style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}
        >
          🔄 Reboot
        </button>
        <button
          onClick={onShutdown}
          disabled={loading}
          className="flex-1 py-3 rounded-lg font-bold"
          style={{ background: '#EF4444', color: 'white' }}
        >
          ⏻ Shutdown
        </button>
      </div>
    </div>
  );
};