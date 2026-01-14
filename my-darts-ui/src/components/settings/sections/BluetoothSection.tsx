import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

interface BluetoothDevice {
  mac: string;
  name: string;
  paired: boolean;
  connected: boolean;
  trusted: boolean;
}

export const BluetoothSection: React.FC = () => {
  const { theme } = useTheme();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bluetooth/devices');
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error('Failed to fetch BT devices:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await fetch('/api/bluetooth/scan', { method: 'POST' });
      await fetchDevices();
    } catch (err) {}
    setScanning(false);
  };

  const handleConnect = async (device: BluetoothDevice) => {
    setLoading(true);
    try {
      await fetch('/api/bluetooth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: device.mac, name: device.name })
      });
      await fetchDevices();
    } catch (err) {}
    setLoading(false);
  };

  const handleDisconnect = async (device: BluetoothDevice) => {
    setLoading(true);
    try {
      await fetch('/api/bluetooth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: device.mac, name: device.name })
      });
      await fetchDevices();
    } catch (err) {}
    setLoading(false);
  };

  const handleUnpair = async (device: BluetoothDevice) => {
    if (!window.confirm(`Unpair ${device.name}?`)) return;
    setLoading(true);
    try {
      await fetch('/api/bluetooth/unpair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: device.mac, name: device.name })
      });
      await fetchDevices();
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Bluetooth</h2>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-4 py-2 rounded-lg font-bold"
          style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex, opacity: scanning ? 0.5 : 1 }}
        >
          {scanning ? 'Scanning...' : '🔍 Scan'}
        </button>
      </div>

      <div className="space-y-2">
        {devices.map(device => (
          <div key={device.mac} className="p-4 rounded-lg flex items-center justify-between" style={{ background: theme.backgrounds.cardHex }}>
            <div>
              <div className="font-medium" style={{ color: theme.text.primary }}>{device.name}</div>
              <div className="text-xs" style={{ color: theme.text.muted }}>
                {device.mac} • {device.connected ? '🟢 Connected' : device.paired ? '🔵 Paired' : '⚪ Available'}
              </div>
            </div>
            <div className="flex gap-2">
              {device.connected ? (
                <button onClick={() => handleDisconnect(device)} disabled={loading} className="px-3 py-1 rounded text-sm" style={{ background: theme.backgrounds.baseHex, color: theme.text.secondary }}>
                  Disconnect
                </button>
              ) : (
                <button onClick={() => handleConnect(device)} disabled={loading} className="px-3 py-1 rounded text-sm" style={{ background: theme.stateColors.active.color }}>
                  Connect
                </button>
              )}
              {device.paired && (
                <button onClick={() => handleUnpair(device)} disabled={loading} className="px-3 py-1 rounded text-sm" style={{ color: '#EF4444' }}>
                  Unpair
                </button>
              )}
            </div>
          </div>
        ))}
        {devices.length === 0 && !loading && (
          <div className="text-center py-8" style={{ color: theme.text.muted }}>
            No devices found. Click Scan to search.
          </div>
        )}
      </div>
    </div>
  );
};