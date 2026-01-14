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

interface StatusCardProps {
  systemStatus: SystemStatus | null;
}

export const StatusCard: React.FC<StatusCardProps> = ({ systemStatus }) => {
  const { theme } = useTheme();

  return (
    <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
      <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Status</h3>
      {systemStatus ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: theme.text.muted }}>Platform:</span>
            <span className="ml-2" style={{ color: theme.text.primary }}>{systemStatus.platform}</span>
          </div>
          <div>
            <span style={{ color: theme.text.muted }}>Hostname:</span>
            <span className="ml-2" style={{ color: theme.text.primary }}>{systemStatus.hostname}</span>
          </div>
          <div>
            <span style={{ color: theme.text.muted }}>IP:</span>
            <span className="ml-2" style={{ color: theme.text.primary }}>{systemStatus.ipAddresses?.join(', ') || 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: theme.text.muted }}>Internet:</span>
            <span className="ml-2" style={{ color: systemStatus.internet ? '#22C55E' : '#EF4444' }}>
              {systemStatus.internet ? '● Online' : '● Offline'}
            </span>
          </div>
          {systemStatus.wifi?.ssid && (
            <div>
              <span style={{ color: theme.text.muted }}>WiFi:</span>
              <span className="ml-2" style={{ color: theme.text.primary }}>{systemStatus.wifi.ssid}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: theme.text.muted }}>Loading...</div>
      )}
    </div>
  );
};