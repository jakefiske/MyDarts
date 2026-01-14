import React from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';

interface Device {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

interface Track {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
}

interface SpotifyPlayerProps {
  track: Track | null;
  progressMs?: number;
  currentDevice?: { name: string; volume_percent: number };
  devices: Device[];
  showDevices: boolean;
  onToggleDevices: () => void;
  onDeviceSelect: (deviceId: string) => void;
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  track,
  progressMs,
  currentDevice,
  devices,
  showDevices,
  onToggleDevices,
  onDeviceSelect
}) => {
  const { theme } = useTheme();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Now Playing */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Now Playing</h3>
        {track ? (
          <div className="flex gap-4">
            {track.album.images[0] && (
              <img 
                src={track.album.images[0].url} 
                alt="Album art"
                className="w-24 h-24 rounded-lg"
              />
            )}
            <div className="flex-1">
              <div className="font-bold text-lg" style={{ color: theme.text.primary }}>
                {track.name}
              </div>
              <div style={{ color: theme.text.muted }}>
                {track.artists.map(a => a.name).join(', ')}
              </div>
              <div className="text-sm mt-1" style={{ color: theme.text.muted }}>
                {track.album.name}
              </div>
              {progressMs !== undefined && (
                <div className="text-xs mt-2" style={{ color: theme.text.muted }}>
                  {formatTime(progressMs)} / {formatTime(track.duration_ms)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: theme.text.muted }}>
            No track playing
          </div>
        )}
      </div>

      {/* Device Selector */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Playback Device</h3>
        {currentDevice && (
          <div className="mb-3 p-3 rounded" style={{ background: theme.backgrounds.baseHex }}>
            <div className="font-bold" style={{ color: theme.text.primary }}>
              🔊 {currentDevice.name}
            </div>
            <div className="text-sm" style={{ color: theme.text.muted }}>
              Volume: {currentDevice.volume_percent}%
            </div>
          </div>
        )}
        <button
          onClick={onToggleDevices}
          className="w-full py-2 rounded-lg font-bold"
          style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}
        >
          {showDevices ? '▲ Hide Devices' : '▼ Show Available Devices'}
        </button>
        {showDevices && (
          <div className="mt-2 space-y-2">
            {devices.length === 0 ? (
              <div className="text-center py-4" style={{ color: theme.text.muted }}>
                No devices found. Open Spotify on a device.
              </div>
            ) : (
              devices.map(device => (
                <button
                  key={device.id}
                  onClick={() => onDeviceSelect(device.id)}
                  className="w-full p-3 rounded-lg text-left"
                  style={{
                    background: device.is_active ? theme.stateColors.active.color + '33' : theme.backgrounds.baseHex,
                    color: theme.text.primary,
                    border: device.is_active ? `2px solid ${theme.stateColors.active.color}` : 'none'
                  }}
                >
                  <div className="font-bold">
                    {device.is_active && '🔊 '}{device.name}
                  </div>
                  <div className="text-sm" style={{ color: theme.text.muted }}>
                    {device.type} • {device.volume_percent}% volume
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};