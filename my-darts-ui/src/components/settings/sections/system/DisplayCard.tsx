import React from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';

interface SystemStatus {
  platform: string;
  hostname: string;
  connected: boolean;
  internet: boolean;
  ipAddresses: string[];
  orientation: string;
  wifi?: { ssid?: string; signal?: string };
}

interface DisplayCardProps {
  systemStatus: SystemStatus | null;
  loading: boolean;
  onRotate: (orientation: string) => void;
}

export const DisplayCard: React.FC<DisplayCardProps> = ({ 
  systemStatus, 
  loading, 
  onRotate 
}) => {
  const { theme } = useTheme();

  return (
    <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
      <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Display Rotation</h3>
      <div className="flex gap-2">
        {['landscape', 'portrait'].map(orientation => (
          <button
            key={orientation}
            onClick={() => onRotate(orientation)}
            disabled={loading}
            className="flex-1 py-3 rounded-lg font-bold capitalize"
            style={{
              background: systemStatus?.orientation === orientation ? theme.stateColors.active.color : theme.backgrounds.baseHex,
              color: theme.text.primary,
              opacity: loading ? 0.5 : 1
            }}
          >
            {orientation === 'landscape' ? '🖥️' : '📱'} {orientation}
          </button>
        ))}
      </div>
    </div>
  );
};