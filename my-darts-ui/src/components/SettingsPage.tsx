import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../hooks/useThemeContext';
import { PlayerManager, SavedPlayer, AppSettings } from '../utils/PlayerManager';
import { AutodartsBridge } from './AutodartsBridge';
import { soundManager } from '../utils/SoundManager';
import { themes } from '../themes';

type ThemeName = 'proDark' | 'broadcast' | 'light';

interface SettingsPageProps {
  onBack: () => void;
}

type Section = 'players' | 'game' | 'theme' | 'sound' | 'cameras' | 'system' | 'bluetooth' | 'spotify' | 'data';

// ===== TYPE DEFINITIONS =====
interface SystemStatus {
  platform: string;
  hostname: string;
  connected: boolean;
  internet: boolean;
  ipAddresses: string[];
  orientation: string;
  wifi?: { ssid?: string; signal?: string };
}

interface BluetoothDevice {
  mac: string;
  name: string;
  paired: boolean;
  connected: boolean;
  trusted: boolean;
}

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

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { theme, themeName, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>('players');
  
  // Player management
  const [players, setPlayers] = useState<SavedPlayer[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<SavedPlayer | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  
  // App Settings
  const [settings, setSettings] = useState<AppSettings>(PlayerManager.getSettings());

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [soundVolume, setSoundVolume] = useState(soundManager.getVolume() * 100);

  // System state
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);
  
  // Bluetooth state
  const [btDevices, setBtDevices] = useState<BluetoothDevice[]>([]);
  const [btScanning, setBtScanning] = useState(false);
  const [btLoading, setBtLoading] = useState(false);
  
  // Spotify state
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus | null>(null);
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');

  // ===== PLAYER FUNCTIONS =====
  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setPlayers(await PlayerManager.getPlayers());
  };

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        await PlayerManager.savePlayer({ name: newPlayerName.trim() });
        setNewPlayerName('');
        setShowAddPlayer(false);
        loadPlayers();
      } catch (error: any) {
        window.alert(error.message || 'Failed to add player');
      }
    }
  };

  const handleUpdatePlayer = async (id: number, name: string) => {
    try {
      await PlayerManager.updatePlayer(id, { name });
      setEditingPlayer(null);
      loadPlayers();
    } catch (error: any) {
      window.alert(error.message || 'Failed to update player');
    }
  };

  const handleDeletePlayer = async (id: number) => {
    if (window.confirm('Delete this player?')) {
      try {
        await PlayerManager.deletePlayer(id);
        loadPlayers();
      } catch (error: any) {
        window.alert(error.message || 'Failed to delete player');
      }
    }
  };

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    PlayerManager.updateSettings({ [key]: value });
  };

  // ===== SYSTEM FUNCTIONS =====
  const fetchSystemStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  }, []);

  const handleReboot = async () => {
    if (!window.confirm('Reboot now?')) return;
    setSystemLoading(true);
    try {
      await fetch('/api/system/reboot', { method: 'POST' });
    } catch (err) {}
    setSystemLoading(false);
  };

  const handleShutdown = async () => {
    if (!window.confirm('Shutdown now?')) return;
    setSystemLoading(true);
    try {
      await fetch('/api/system/shutdown', { method: 'POST' });
    } catch (err) {}
    setSystemLoading(false);
  };

  const handleRotate = async (orientation: string) => {
    setSystemLoading(true);
    try {
      const res = await fetch(`/api/system/rotate?orientation=${orientation}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSystemStatus(prev => prev ? { ...prev, orientation } : null);
      }
    } catch (err) {}
    setSystemLoading(false);
  };

  // ===== BLUETOOTH FUNCTIONS =====
  const fetchBtDevices = useCallback(async () => {
    setBtLoading(true);
    try {
      const res = await fetch('/api/bluetooth/devices');
      const data = await res.json();
      setBtDevices(data.devices || []);
    } catch (err) {
      console.error('Failed to fetch BT devices:', err);
    }
    setBtLoading(false);
  }, []);

  const handleBtScan = async () => {
    setBtScanning(true);
    try {
      await fetch('/api/bluetooth/scan', { method: 'POST' });
      await fetchBtDevices();
    } catch (err) {}
    setBtScanning(false);
  };

  const handleBtConnect = async (device: BluetoothDevice) => {
    setBtLoading(true);
    try {
      await fetch('/api/bluetooth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: device.mac, name: device.name })
      });
      await fetchBtDevices();
    } catch (err) {}
    setBtLoading(false);
  };

  const handleBtDisconnect = async (device: BluetoothDevice) => {
    setBtLoading(true);
    try {
      await fetch('/api/bluetooth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: device.mac, name: device.name })
      });
      await fetchBtDevices();
    } catch (err) {}
    setBtLoading(false);
  };

  const handleBtUnpair = async (device: BluetoothDevice) => {
    if (!window.confirm(`Unpair ${device.name}?`)) return;
    setBtLoading(true);
    try {
      await fetch('/api/bluetooth/unpair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: device.mac, name: device.name })
      });
      await fetchBtDevices();
    } catch (err) {}
    setBtLoading(false);
  };

  // ===== SPOTIFY FUNCTIONS =====
  const fetchSpotifyStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/spotify/status');
      const data = await res.json();
      setSpotifyStatus(data);
    } catch (err) {
      console.error('Failed to fetch Spotify status:', err);
    }
  }, []);

  const fetchSpotifyConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/spotify/config');
      const data = await res.json();
      if (data.clientId) setSpotifyClientId(data.clientId);
      // Don't load secret for security - just show placeholder if configured
    } catch (err) {
      console.error('Failed to fetch Spotify config:', err);
    }
  }, []);

  const handleSaveSpotifyConfig = async () => {
    setSpotifyLoading(true);
    try {
      const res = await fetch('/api/spotify/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: spotifyClientId, clientSecret: spotifyClientSecret })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSpotifyStatus();
        setSpotifyClientSecret(''); // Clear secret after save
      }
    } catch (err) {
      console.error('Failed to save Spotify config:', err);
    }
    setSpotifyLoading(false);
  };

  const fetchPlayback = useCallback(async () => {
    if (!spotifyStatus?.authenticated) return;
    try {
      const res = await fetch('/api/spotify/playback');
      const data = await res.json();
      setPlayback(data);
    } catch (err) {}
  }, [spotifyStatus?.authenticated]);

  const handleSpotifyLogin = async () => {
    try {
      const res = await fetch('/api/spotify/login');
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
    } catch (err) {}
  };

  const handleSpotifyLogout = async () => {
    setSpotifyLoading(true);
    try {
      await fetch('/api/spotify/logout', { method: 'POST' });
      setSpotifyStatus(prev => prev ? { ...prev, authenticated: false } : null);
      setPlayback(null);
    } catch (err) {}
    setSpotifyLoading(false);
  };

  const handleSpotifyControl = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    setSpotifyLoading(true);
    try {
      await fetch(`/api/spotify/${action}`, { method: 'POST' });
      setTimeout(fetchPlayback, 500);
    } catch (err) {}
    setSpotifyLoading(false);
  };

  // ===== DATA FUNCTIONS =====
  const handleExport = async () => {
    const data = await PlayerManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mydarts-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (await PlayerManager.importData(content)) {
          window.alert('Data imported successfully!');
          loadPlayers();
          setSettings(PlayerManager.getSettings());
        } else {
          window.alert('Failed to import data.');
        }
      };
      reader.readAsText(file);
    }
  };

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchSystemStatus();
    fetchBtDevices();
    fetchSpotifyStatus();
    fetchSpotifyConfig();
  }, [fetchSystemStatus, fetchBtDevices, fetchSpotifyStatus, fetchSpotifyConfig]);

  useEffect(() => {
    if (spotifyStatus?.authenticated) {
      fetchPlayback();
      const interval = setInterval(fetchPlayback, 10000);
      return () => clearInterval(interval);
    }
  }, [spotifyStatus?.authenticated, fetchPlayback]);

  // ===== NAVIGATION =====
  const sections: { id: Section; label: string; icon: string; group: string }[] = [
    { id: 'players', label: 'Players', icon: '👥', group: 'App' },
    { id: 'game', label: 'Game Defaults', icon: '🎯', group: 'App' },
    { id: 'theme', label: 'Theme', icon: '🎨', group: 'App' },
    { id: 'sound', label: 'Sound', icon: '🔊', group: 'App' },
    { id: 'cameras', label: 'Cameras', icon: '📷', group: 'App' },
    { id: 'system', label: 'System', icon: '🖥️', group: 'Pi Control' },
    { id: 'bluetooth', label: 'Bluetooth', icon: '📶', group: 'Pi Control' },
    { id: 'spotify', label: 'Spotify', icon: '🎵', group: 'Pi Control' },
    { id: 'data', label: 'Data', icon: '💾', group: 'App' },
  ];

  const groups = Array.from(new Set(sections.map(s => s.group)));

  return (
    <div className="h-full flex" style={{ backgroundColor: theme.backgrounds.baseHex }}>
      {/* ===== SIDEBAR ===== */}
      <div className="w-64 flex-shrink-0 border-r flex flex-col" 
           style={{ borderColor: theme.borders.secondary, background: theme.backgrounds.cardHex }}>
        
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: theme.borders.secondary }}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition"
            style={{ color: theme.text.primary }}
          >
            ← Back to Game
          </button>
          <h1 className="text-xl font-bold mt-2" style={{ color: theme.text.primary, fontFamily: theme.fonts.display }}>
            Settings
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto py-2">
          {groups.map(group => (
            <div key={group} className="mb-4">
              <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider" 
                   style={{ color: theme.text.muted }}>
                {group}
              </div>
              {sections.filter(s => s.group === group).map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left transition"
                  style={{
                    background: activeSection === section.id ? theme.stateColors.active.color + '33' : 'transparent',
                    color: theme.text.primary,
                    borderLeft: activeSection === section.id ? `3px solid ${theme.stateColors.active.color}` : '3px solid transparent'
                  }}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* System Info Footer */}
        {systemStatus && (
          <div className="p-4 border-t text-xs" style={{ borderColor: theme.borders.secondary, color: theme.text.muted }}>
            <div>{systemStatus.hostname}</div>
            <div>{systemStatus.ipAddresses?.[0]}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className={systemStatus.internet ? 'text-green-500' : 'text-red-500'}>●</span>
              {systemStatus.internet ? 'Online' : 'Offline'}
            </div>
          </div>
        )}
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">

          {/* PLAYERS */}
          {activeSection === 'players' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                  Players ({players.length})
                </h2>
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="px-4 py-2 rounded-lg font-bold"
                  style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex }}
                >
                  + Add Player
                </button>
              </div>

              {showAddPlayer && (
                <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Player name"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                      autoFocus
                      className="flex-1 px-3 py-2 rounded"
                      style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
                    />
                    <button onClick={handleAddPlayer} className="px-4 py-2 rounded font-bold" style={{ background: theme.stateColors.active.color }}>
                      Add
                    </button>
                    <button onClick={() => setShowAddPlayer(false)} className="px-4 py-2 rounded" style={{ background: theme.backgrounds.baseHex, color: theme.text.secondary }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {players.map(player => (
                  <div key={player.id} className="p-4 rounded-lg flex items-center justify-between" style={{ background: theme.backgrounds.cardHex }}>
                    {editingPlayer?.id === player.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingPlayer.name}
                          onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdatePlayer(player.id!, editingPlayer.name)}
                          autoFocus
                          className="flex-1 px-3 py-2 rounded"
                          style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}
                        />
                        <button onClick={() => handleUpdatePlayer(player.id!, editingPlayer.name)} className="px-3 py-1 rounded" style={{ background: theme.stateColors.active.color }}>
                          Save
                        </button>
                        <button onClick={() => setEditingPlayer(null)} style={{ color: theme.text.secondary }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium" style={{ color: theme.text.primary }}>{player.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingPlayer(player)} className="px-3 py-1 rounded text-sm" style={{ background: theme.backgrounds.baseHex, color: theme.text.secondary }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeletePlayer(player.id!)} className="px-3 py-1 rounded text-sm" style={{ color: '#EF4444' }}>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {players.length === 0 && (
                  <div className="text-center py-8" style={{ color: theme.text.muted }}>
                    No players yet. Add your first player above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GAME DEFAULTS */}
          {activeSection === 'game' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Game Defaults</h2>

              {/* Mickey Mouse */}
              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <h3 className="font-bold mb-4" style={{ color: theme.text.primary }}>Mickey Mouse Cricket</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm" style={{ color: theme.text.muted }}>Default Range</label>
                    <div className="flex gap-2">
                      {[10, 11, 12, 15].map(num => (
                        <button
                          key={num}
                          onClick={() => handleSettingChange('defaultMickeyMouseRange', num)}
                          className="flex-1 py-2 rounded font-bold"
                          style={{
                            background: settings.defaultMickeyMouseRange === num ? theme.stateColors.active.color : theme.backgrounds.baseHex,
                            color: theme.text.primary,
                            border: `2px solid ${settings.defaultMickeyMouseRange === num ? theme.stateColors.active.border : theme.borders.secondary}`
                          }}
                        >
                          20-{num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.defaultIncludeDoubles} onChange={(e) => handleSettingChange('defaultIncludeDoubles', e.target.checked)} className="w-5 h-5" />
                    <span style={{ color: theme.text.primary }}>Include Doubles</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.defaultIncludeTriples} onChange={(e) => handleSettingChange('defaultIncludeTriples', e.target.checked)} className="w-5 h-5" />
                    <span style={{ color: theme.text.primary }}>Include Triples</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.defaultIncludeBeds} onChange={(e) => handleSettingChange('defaultIncludeBeds', e.target.checked)} className="w-5 h-5" />
                    <span style={{ color: theme.text.primary }}>Include Beds</span>
                  </label>
                </div>
              </div>

              {/* X01 */}
              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <h3 className="font-bold mb-4" style={{ color: theme.text.primary }}>X01</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm" style={{ color: theme.text.muted }}>Default Starting Score</label>
                    <div className="flex gap-2">
                      {[301, 501, 701].map(score => (
                        <button
                          key={score}
                          onClick={() => handleSettingChange('defaultX01Score', score)}
                          className="flex-1 py-2 rounded font-bold"
                          style={{
                            background: settings.defaultX01Score === score ? theme.stateColors.active.color : theme.backgrounds.baseHex,
                            color: theme.text.primary,
                            border: `2px solid ${settings.defaultX01Score === score ? theme.stateColors.active.border : theme.borders.secondary}`
                          }}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.defaultDoubleIn} onChange={(e) => handleSettingChange('defaultDoubleIn', e.target.checked)} className="w-5 h-5" />
                    <span style={{ color: theme.text.primary }}>Double In</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* THEME */}
          {activeSection === 'theme' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Theme</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { key: 'proDark' as ThemeName, name: 'Pro Dark', icon: '🎯', desc: 'Professional dark theme' },
                  { key: 'broadcast' as ThemeName, name: 'Broadcast', icon: '📺', desc: 'High-energy for tournaments' },
                  { key: 'light' as ThemeName, name: 'Light', icon: '☀️', desc: 'Clean light theme' },
                ]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className="p-4 rounded-lg text-left transition-all"
                    style={{
                      background: themeName === t.key ? `${theme.stateColors.active.color}22` : theme.backgrounds.cardHex,
                      border: `2px solid ${themeName === t.key ? theme.stateColors.active.color : theme.borders.secondary}`
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{t.icon}</span>
                      <span className="font-bold" style={{ color: theme.text.primary }}>{t.name}</span>
                      {themeName === t.key && (
                        <span className="ml-auto text-xs px-2 py-1 rounded" style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex }}>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: theme.text.muted }}>{t.desc}</p>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>Color Preview</h3>
                <div className="flex gap-2">
                  {theme.playerColors.slice(0, 6).map((color: any, i: number) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-lg"
                      style={{ backgroundColor: color.primary }}
                      title={`Player ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SOUND */}
          {activeSection === 'sound' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Sound</h2>
              
              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-medium" style={{ color: theme.text.primary }}>Sound Effects</span>
                  <button
                    onClick={() => {
                      const newEnabled = !soundEnabled;
                      setSoundEnabled(newEnabled);
                      soundManager.setEnabled(newEnabled);
                    }}
                    className="px-6 py-2 rounded-lg font-bold transition-all"
                    style={{
                      background: soundEnabled ? theme.stateColors.active.color : theme.backgrounds.baseHex,
                      color: soundEnabled ? theme.backgrounds.baseHex : theme.text.muted,
                      border: `2px solid ${soundEnabled ? theme.stateColors.active.border : theme.borders.secondary}`
                    }}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span style={{ color: theme.text.primary }}>Volume</span>
                    <span style={{ color: theme.text.muted }}>{Math.round(soundVolume)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundVolume}
                    onChange={(e) => {
                      const vol = parseInt(e.target.value);
                      setSoundVolume(vol);
                      soundManager.setVolume(vol / 100);
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ background: theme.backgrounds.baseHex }}
                  />
                </div>

                <button
                  onClick={() => soundManager.play('oneEighty')}
                  className="w-full py-3 rounded-lg font-bold"
                  style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
                >
                  🎤 Test Sound
                </button>
              </div>
            </div>
          )}

          {/* CAMERAS */}
          {activeSection === 'cameras' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Camera Integration</h2>
              
              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <p className="text-sm mb-4" style={{ color: theme.text.muted }}>
                  Configure your Autodarts camera system to automatically detect throws.
                </p>
                <AutodartsBridge />
              </div>

              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>How It Works</h3>
                <ul className="text-sm space-y-1" style={{ color: theme.text.muted }}>
                  <li>• Configure your darts-caller URL above</li>
                  <li>• Toggle the bridge on during games</li>
                  <li>• Throws are automatically detected</li>
                </ul>
              </div>
            </div>
          )}

          {/* SYSTEM */}
          {activeSection === 'system' && (
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
                      disabled={systemLoading}
                      className="flex-1 py-3 rounded-lg font-bold capitalize"
                      style={{
                        background: systemStatus?.orientation === orientation ? theme.stateColors.active.color : theme.backgrounds.baseHex,
                        color: theme.text.primary,
                        opacity: systemLoading ? 0.5 : 1
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
                    disabled={systemLoading}
                    className="flex-1 py-3 rounded-lg font-bold"
                    style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}
                  >
                    🔄 Reboot
                  </button>
                  <button
                    onClick={handleShutdown}
                    disabled={systemLoading}
                    className="flex-1 py-3 rounded-lg font-bold"
                    style={{ background: '#EF4444', color: 'white' }}
                  >
                    ⏻ Shutdown
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BLUETOOTH */}
          {activeSection === 'bluetooth' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Bluetooth</h2>
                <button
                  onClick={handleBtScan}
                  disabled={btScanning}
                  className="px-4 py-2 rounded-lg font-bold"
                  style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex, opacity: btScanning ? 0.5 : 1 }}
                >
                  {btScanning ? 'Scanning...' : '🔍 Scan'}
                </button>
              </div>

              <div className="space-y-2">
                {btDevices.map(device => (
                  <div key={device.mac} className="p-4 rounded-lg flex items-center justify-between" style={{ background: theme.backgrounds.cardHex }}>
                    <div>
                      <div className="font-medium" style={{ color: theme.text.primary }}>{device.name}</div>
                      <div className="text-xs" style={{ color: theme.text.muted }}>
                        {device.mac} • {device.connected ? '🟢 Connected' : device.paired ? '🔵 Paired' : '⚪ Available'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {device.connected ? (
                        <button onClick={() => handleBtDisconnect(device)} disabled={btLoading} className="px-3 py-1 rounded text-sm" style={{ background: theme.backgrounds.baseHex, color: theme.text.secondary }}>
                          Disconnect
                        </button>
                      ) : (
                        <button onClick={() => handleBtConnect(device)} disabled={btLoading} className="px-3 py-1 rounded text-sm" style={{ background: theme.stateColors.active.color }}>
                          Connect
                        </button>
                      )}
                      {device.paired && (
                        <button onClick={() => handleBtUnpair(device)} disabled={btLoading} className="px-3 py-1 rounded text-sm" style={{ color: '#EF4444' }}>
                          Unpair
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {btDevices.length === 0 && !btLoading && (
                  <div className="text-center py-8" style={{ color: theme.text.muted }}>
                    No devices found. Click Scan to search.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SPOTIFY */}
          {activeSection === 'spotify' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Spotify</h2>

              {/* Configuration */}
              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>API Configuration</h3>
                <p className="text-sm mb-4" style={{ color: theme.text.muted }}>
                  Get your credentials from the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: theme.stateColors.active.color }}>Spotify Developer Dashboard</a>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: theme.text.muted }}>Client ID</label>
                    <input
                      type="text"
                      value={spotifyClientId}
                      onChange={(e) => setSpotifyClientId(e.target.value)}
                      placeholder="Enter Client ID"
                      className="w-full px-3 py-2 rounded-lg"
                      style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: theme.text.muted }}>Client Secret</label>
                    <input
                      type="password"
                      value={spotifyClientSecret}
                      onChange={(e) => setSpotifyClientSecret(e.target.value)}
                      placeholder="Enter Client Secret"
                      className="w-full px-3 py-2 rounded-lg"
                      style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
                    />
                  </div>
                  <button
                    onClick={handleSaveSpotifyConfig}
                    disabled={spotifyLoading}
                    className="px-4 py-2 rounded-lg font-bold"
                    style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex }}
                  >
                    {spotifyLoading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>

              {spotifyStatus?.configured && !spotifyStatus?.authenticated && (
                <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                  <p className="mb-4" style={{ color: theme.text.muted }}>Configuration saved. Connect your Spotify account to control playback.</p>
                  <button onClick={handleSpotifyLogin} className="px-6 py-3 rounded-lg font-bold" style={{ background: '#1DB954', color: 'white' }}>
                    🎵 Connect Spotify
                  </button>
                </div>
              )}

              {spotifyStatus?.authenticated && (
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
                      <button onClick={() => handleSpotifyControl('previous')} disabled={spotifyLoading} className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}>
                        ⏮️
                      </button>
                      <button 
                        onClick={() => handleSpotifyControl(playback?.is_playing ? 'pause' : 'play')} 
                        disabled={spotifyLoading} 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                        style={{ background: '#1DB954', color: 'white' }}
                      >
                        {playback?.is_playing ? '⏸️' : '▶️'}
                      </button>
                      <button onClick={() => handleSpotifyControl('next')} disabled={spotifyLoading} className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}>
                        ⏭️
                      </button>
                    </div>
                  </div>

                  {/* Logout */}
                  <button onClick={handleSpotifyLogout} className="text-sm" style={{ color: theme.text.muted }}>
                    Disconnect Spotify
                  </button>
                </>
              )}
            </div>
          )}

          {/* DATA */}
          {activeSection === 'data' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Data Management</h2>

              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>Export</h3>
                <p className="text-sm mb-3" style={{ color: theme.text.muted }}>Download all your data as a backup.</p>
                <button onClick={handleExport} className="px-4 py-2 rounded-lg font-bold" style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex }}>
                  📥 Export Data
                </button>
              </div>

              <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
                <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>Import</h3>
                <p className="text-sm mb-3" style={{ color: theme.text.muted }}>Restore from a backup file.</p>
                <input type="file" accept=".json" onChange={handleImport} style={{ color: theme.text.primary }} />
              </div>

              <div className="p-4 rounded-lg border-2 border-red-500" style={{ background: theme.backgrounds.cardHex }}>
                <h3 className="font-bold mb-2" style={{ color: '#EF4444' }}>Clear All Data</h3>
                <p className="text-sm mb-3" style={{ color: theme.text.muted }}>Delete everything. Cannot be undone!</p>
                <button
                  onClick={async () => {
                    if (window.confirm('Delete ALL data? This cannot be undone!')) {
                      await PlayerManager.clearAllData();
                      setPlayers([]);
                      setSettings(PlayerManager.getSettings());
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-bold"
                  style={{ background: '#EF4444', color: 'white' }}
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;