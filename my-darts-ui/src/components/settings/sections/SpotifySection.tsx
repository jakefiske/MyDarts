import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

interface SpotifyStatus {
  configured: boolean;
  authenticated: boolean;
  hasTokens: boolean;
}

interface SpotifyPlayback {
  is_playing?: boolean;
  item?: {
    name: string;
    artists: { name: string }[];
    album?: { images?: { url: string }[] };
  };
}

export const SpotifySection: React.FC = () => {
  const { theme } = useTheme();
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/spotify/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch Spotify status:', err);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/spotify/config');
      const data = await res.json();
      if (data.clientId) setClientId(data.clientId);
    } catch (err) {
      console.error('Failed to fetch Spotify config:', err);
    }
  }, []);

  const fetchPlayback = useCallback(async () => {
    if (!status?.authenticated) return;
    try {
      const res = await fetch('/api/spotify/playback');
      const data = await res.json();
      setPlayback(data);
    } catch (err) {}
  }, [status?.authenticated]);

  useEffect(() => {
    fetchStatus();
    fetchConfig();
  }, [fetchStatus, fetchConfig]);

  useEffect(() => {
    if (status?.authenticated) {
      fetchPlayback();
      const interval = setInterval(fetchPlayback, 10000);
      return () => clearInterval(interval);
    }
  }, [status?.authenticated, fetchPlayback]);

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/spotify/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret })
      });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
        setClientSecret('');
      }
    } catch (err) {
      console.error('Failed to save Spotify config:', err);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/spotify/login');
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
    } catch (err) {}
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/spotify/logout', { method: 'POST' });
      setStatus(prev => prev ? { ...prev, authenticated: false } : null);
      setPlayback(null);
    } catch (err) {}
    setLoading(false);
  };

  const handleControl = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    setLoading(true);
    try {
      await fetch(`/api/spotify/${action}`, { method: 'POST' });
      setTimeout(fetchPlayback, 500);
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Spotify</h2>

      {/* Configuration */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>API Configuration</h3>
        <p className="text-sm mb-4" style={{ color: theme.text.muted }}>
          Get your credentials from the{' '}
          <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: theme.stateColors.active.color }}>
            Spotify Developer Dashboard
          </a>
        </p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: theme.text.muted }}>Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter Client ID"
              className="w-full px-3 py-2 rounded-lg"
              style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: theme.text.muted }}>Client Secret</label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter Client Secret"
              className="w-full px-3 py-2 rounded-lg"
              style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
            />
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-bold"
            style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex }}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {status?.configured && !status?.authenticated && (
        <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
          <p className="mb-4" style={{ color: theme.text.muted }}>Configuration saved. Connect your Spotify account to control playback.</p>
          <button onClick={handleLogin} className="px-6 py-3 rounded-lg font-bold" style={{ background: '#1DB954', color: 'white' }}>
            🎵 Connect Spotify
          </button>
        </div>
      )}

      {status?.authenticated && (
        <>
          {/* Now Playing */}
          <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: theme.backgrounds.baseHex }}>
                {playback?.item?.album?.images?.[0]?.url ? (
                  <img src={playback.item.album.images[0].url} alt="" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <span className="text-2xl">🎵</span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: theme.text.primary }}>
                  {playback?.item?.name || 'No track playing'}
                </div>
                <div className="text-sm" style={{ color: theme.text.muted }}>
                  {playback?.item?.artists?.map(a => a.name).join(', ') || '-'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => handleControl('previous')} disabled={loading} className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}>
                ⏮️
              </button>
              <button 
                onClick={() => handleControl(playback?.is_playing ? 'pause' : 'play')} 
                disabled={loading} 
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: '#1DB954', color: 'white' }}
              >
                {playback?.is_playing ? '⏸️' : '▶️'}
              </button>
              <button onClick={() => handleControl('next')} disabled={loading} className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}>
                ⏭️
              </button>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="text-sm" style={{ color: theme.text.muted }}>
            Disconnect Spotify
          </button>
        </>
      )}
    </div>
  );
};