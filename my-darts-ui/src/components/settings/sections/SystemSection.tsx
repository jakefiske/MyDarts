import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

interface SystemStatus {
  platform: string;
  hostname: string;
  connected: boolean;
  internet: boolean;
  ipAddresses: string[];
  orientation: string;
  wifi?: { ssid?: string; signal?: string };
}

export const SystemSection: React.FC = () => {
  const { theme } = useTheme();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleReboot = async () => {
    if (!window.confirm('Reboot now?')) return;
    setLoading(true);
    try {
      await fetch('/api/system/reboot', { method: 'POST' });
    } catch (err) {}
    setLoading(false);
  };

  const handleShutdown = async () => {
    if (!window.confirm('Shutdown now?')) return;
    setLoading(true);
    try {
      await fetch('/api/system/shutdown', { method: 'POST' });
    } catch (err) {}
    setLoading(false);
  };

  const handleRotate = async (orientation: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/system/rotate?orientation=${orientation}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSystemStatus(prev => prev ? { ...prev, orientation } : null);
      }
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>System</h2>
      
      {/* Status */}
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

      {/* Display */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Display Rotation</h3>
        <div className="flex gap-2">
          {['landscape', 'portrait'].map(orientation => (
            <button
              key={orientation}
              onClick={() => handleRotate(orientation)}
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

      {/* Power */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Power</h3>
        <div className="flex gap-2">
          <button
            onClick={handleReboot}
            disabled={loading}
            className="flex-1 py-3 rounded-lg font-bold"
            style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}
          >
            🔄 Reboot
          </button>
          <button
            onClick={handleShutdown}
            disabled={loading}
            className="flex-1 py-3 rounded-lg font-bold"
            style={{ background: '#EF4444', color: 'white' }}
          >
            ⏻ Shutdown
          </button>
        </div>
      </div>
    </div>
  );
};

export { SystemSection as default };