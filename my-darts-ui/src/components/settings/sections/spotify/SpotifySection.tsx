import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';
import { SpotifySetup } from './SpotifySetup';
import { SpotifyPlayer } from './SpotifyPlayer';
import { SpotifyControls } from './SpotifyControls';

interface SpotifyStatus {
  configured: boolean;
  authenticated: boolean;
}

interface Device {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

interface PlaybackState {
  isPlaying: boolean;
  item?: {
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
    duration_ms: number;
  };
  progress_ms?: number;
  device?: {
    name: string;
    volume_percent: number;
  };
}

export const SpotifySection: React.FC = () => {
  const { theme } = useTheme();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [status, setStatus] = useState<SpotifyStatus>({ configured: false, authenticated: false });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [piIp, setPiIp] = useState('localhost');
  
  // Player state
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showDevices, setShowDevices] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    fetchPiIp();
  }, []);

  useEffect(() => {
    if (status.authenticated) {
      fetchPlayback();
      fetchDevices();
      
      const interval = setInterval(() => {
        fetchPlayback();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [status.authenticated]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/spotify/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/spotify/config');
      const data = await res.json();
      setClientId(data.clientId || '');
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const fetchPiIp = async () => {
    try {
      if (window.location.hostname === 'localhost') {
        setPiIp('127.0.0.1');
        return;
      }
      
      const res = await fetch('/api/system/status');
      const data = await res.json();
      if (data.ipAddresses && data.ipAddresses.length > 0) {
        setPiIp(data.ipAddresses[0]);
      }
    } catch (err) {}
  };

  const fetchPlayback = async () => {
    try {
      const res = await fetch('/api/spotify/playback');
      if (res.ok) {
        const data = await res.json();
        setPlayback(data);
      }
    } catch (err) {}
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/spotify/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (err) {}
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/spotify/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret })
      });
      
      if (res.ok) {
        setSaveStatus('✓ Saved successfully');
        fetchStatus();
      } else {
        setSaveStatus('✗ Failed to save configuration');
      }
    } catch (err) {
      setSaveStatus('✗ Error saving configuration');
    }
    setSaving(false);
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/spotify/login');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handlePlay = async () => {
    try {
      await fetch('/api/spotify/play', { method: 'POST' });
      setTimeout(fetchPlayback, 500);
    } catch (err) {}
  };

  const handlePause = async () => {
    try {
      await fetch('/api/spotify/pause', { method: 'POST' });
      setTimeout(fetchPlayback, 500);
    } catch (err) {}
  };

  const handleNext = async () => {
    try {
      await fetch('/api/spotify/next', { method: 'POST' });
      setTimeout(fetchPlayback, 1000);
    } catch (err) {}
  };

  const handlePrevious = async () => {
    try {
      await fetch('/api/spotify/previous', { method: 'POST' });
      setTimeout(fetchPlayback, 1000);
    } catch (err) {}
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      await fetch('/api/spotify/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume })
      });
      setTimeout(fetchPlayback, 500);
    } catch (err) {}
  };

  const handleDeviceSelect = async (deviceId: string) => {
    try {
      await fetch('/api/spotify/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      setShowDevices(false);
      setTimeout(fetchPlayback, 1000);
    } catch (err) {}
  };

  const redirectUri = `http://${piIp}:5025/api/spotify/callback`;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Spotify Integration</h2>
      
      {!status.configured && (
        <SpotifySetup
          clientId={clientId}
          clientSecret={clientSecret}
          redirectUri={redirectUri}
          saving={saving}
          saveStatus={saveStatus}
          onClientIdChange={setClientId}
          onClientSecretChange={setClientSecret}
          onSave={handleSave}
        />
      )}

      {status.configured && !status.authenticated && (
        <div className="p-6 rounded-lg text-center" style={{ background: theme.backgrounds.cardHex }}>
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.text.primary }}>Connect Your Spotify Account</h3>
          <p className="mb-6" style={{ color: theme.text.muted }}>
            Authorize MyDarts to control your Spotify playback
          </p>
          <button
            onClick={handleLogin}
            className="px-8 py-4 rounded-lg font-bold text-lg"
            style={{ background: '#1DB954', color: 'white' }}
          >
            🔗 Login with Spotify
          </button>
        </div>
      )}

      {status.authenticated && (
        <>
          <SpotifyPlayer
            track={playback?.item || null}
            progressMs={playback?.progress_ms}
            currentDevice={playback?.device}
            devices={devices}
            showDevices={showDevices}
            onToggleDevices={() => {
              setShowDevices(!showDevices);
              if (!showDevices) fetchDevices();
            }}
            onDeviceSelect={handleDeviceSelect}
          />
          
          <SpotifyControls
            isPlaying={playback?.isPlaying || false}
            currentVolume={playback?.device?.volume_percent || 50}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onVolumeChange={handleVolumeChange}
          />
        </>
      )}
    </div>
  );
};