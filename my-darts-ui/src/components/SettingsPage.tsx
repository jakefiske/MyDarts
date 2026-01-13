import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useThemeContext';
import { PlayerManager, SavedPlayer, AppSettings } from '../utils/PlayerManager';
import { AutodartsBridge } from './AutodartsBridge';

interface SettingsPageProps {
  onBack: () => void;
}

type Tab = 'players' | 'game' | 'cameras' | 'data';

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('players');
  
  // Player management
  const [players, setPlayers] = useState<SavedPlayer[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<SavedPlayer | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(PlayerManager.getSettings());

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
    if (window.confirm('Delete this player? This cannot be undone.')) {
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
          window.alert('Failed to import data. Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'players', label: 'Players', icon: '👥' },
    { id: 'game', label: 'Game Defaults', icon: '🎯' },
    { id: 'cameras', label: 'Cameras', icon: '📷' },
    { id: 'data', label: 'Data', icon: '💾' },
  ];

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: theme.backgrounds.baseHex }}>
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-3 border-b" 
           style={{ borderColor: theme.borders.secondary }}>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded font-bold"
          style={{ background: theme.backgrounds.cardHex, color: theme.text.primary }}
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold" style={{ color: theme.text.primary, fontFamily: theme.fonts.display }}>
          Settings
        </h1>
        <div className="w-20"></div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b" style={{ borderColor: theme.borders.secondary }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 font-bold transition"
            style={{
              background: activeTab === tab.id
                ? `linear-gradient(to right, ${theme.stateColors.active.gradient})`
                : theme.backgrounds.baseHex,
              color: theme.text.primary,
              borderBottom: activeTab === tab.id ? `3px solid ${theme.stateColors.active.border}` : 'none'
            }}
          >
            {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: theme.text.primary }}>
                Saved Players ({players.length})
              </h2>
              <button
                onClick={() => setShowAddPlayer(true)}
                className="px-4 py-2 rounded font-bold"
                style={{
                  background: `linear-gradient(to right, ${theme.stateColors.active.gradient})`,
                  color: theme.text.primary,
                  border: `2px solid ${theme.stateColors.active.border}`
                }}
              >
                + Add Player
              </button>
            </div>

            {/* Add Player Form */}
            {showAddPlayer && (
              <div className="p-4 rounded-lg border-2"
                   style={{ background: theme.backgrounds.cardHex, borderColor: theme.stateColors.active.border }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Player name"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded"
                    style={{
                      background: theme.backgrounds.baseHex,
                      color: theme.text.primary,
                      border: `1px solid ${theme.borders.secondary}`
                    }}
                  />
                  <button
                    onClick={handleAddPlayer}
                    className="px-4 py-2 rounded font-bold"
                    style={{
                      background: theme.stateColors.active.color,
                      color: theme.text.primary
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPlayer(false);
                      setNewPlayerName('');
                    }}
                    className="px-4 py-2 rounded"
                    style={{
                      background: theme.backgrounds.baseHex,
                      color: theme.text.secondary
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Players List */}
            <div className="space-y-2">
              {players.length === 0 ? (
                <div className="text-center py-12" style={{ color: theme.text.muted }}>
                  No saved players yet. Add some to get started!
                </div>
              ) : (
                players.map(player => (
                  <div
                    key={player.id}
                    className="p-4 rounded-lg border"
                    style={{
                      background: theme.backgrounds.cardHex,
                      borderColor: theme.borders.secondary
                    }}
                  >
                    {editingPlayer?.id === player.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingPlayer.name}
                          onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdatePlayer(player.id, editingPlayer.name)}
                          className="flex-1 px-3 py-2 rounded"
                          style={{
                            background: theme.backgrounds.baseHex,
                            color: theme.text.primary,
                            border: `1px solid ${theme.borders.secondary}`
                          }}
                        />
                        <button
                          onClick={() => handleUpdatePlayer(player.id, editingPlayer.name)}
                          className="px-3 py-2 rounded font-bold text-sm"
                          style={{ background: theme.stateColors.active.color, color: theme.text.primary }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPlayer(null)}
                          className="px-3 py-2 rounded text-sm"
                          style={{ background: theme.backgrounds.baseHex, color: theme.text.secondary }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-lg" style={{ color: theme.text.primary }}>
                            {player.name}
                          </div>
                          <div className="text-sm" style={{ color: theme.text.muted }}>
                            {player.gamesPlayed} games played
                            {player.lastPlayedAt && ` · Last played ${new Date(player.lastPlayedAt).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPlayer(player)}
                            className="px-3 py-1 rounded text-sm"
                            style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="px-3 py-1 rounded text-sm"
                            style={{
                              background: `linear-gradient(to right, ${theme.stateColors.bust.gradient})`,
                              color: theme.text.primary
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* GAME DEFAULTS TAB */}
        {activeTab === 'game' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
              Game Default Settings
            </h2>

            {/* Mickey Mouse Defaults */}
            <div className="p-4 rounded-lg border" style={{ background: theme.backgrounds.cardHex, borderColor: theme.borders.secondary }}>
              <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Mickey Mouse Cricket</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block mb-2 text-sm" style={{ color: theme.text.muted }}>Default Range</label>
                  <div className="flex gap-2">
                    {[10, 11, 12, 15].map(num => (
                      <button
                        key={num}
                        onClick={() => handleSettingChange('defaultMickeyMouseRange', num)}
                        className="flex-1 py-2 rounded font-bold text-sm"
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
                  <input
                    type="checkbox"
                    checked={settings.defaultIncludeDoubles}
                    onChange={(e) => handleSettingChange('defaultIncludeDoubles', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span style={{ color: theme.text.primary }}>Include Doubles by default</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.defaultIncludeTriples}
                    onChange={(e) => handleSettingChange('defaultIncludeTriples', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span style={{ color: theme.text.primary }}>Include Triples by default</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.defaultIncludeBeds}
                    onChange={(e) => handleSettingChange('defaultIncludeBeds', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span style={{ color: theme.text.primary }}>Include Beds by default</span>
                </label>
              </div>
            </div>

            {/* X01 Defaults */}
            <div className="p-4 rounded-lg border" style={{ background: theme.backgrounds.cardHex, borderColor: theme.borders.secondary }}>
              <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>X01</h3>
              
              <div className="space-y-3">
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
                  <input
                    type="checkbox"
                    checked={settings.defaultDoubleIn}
                    onChange={(e) => handleSettingChange('defaultDoubleIn', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span style={{ color: theme.text.primary }}>Double In by default</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* CAMERAS TAB */}
        {activeTab === 'cameras' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
              Autodarts Camera Integration
            </h2>
            
            <div className="p-4 rounded-lg border" style={{ background: theme.backgrounds.cardHex, borderColor: theme.borders.secondary }}>
              <p className="text-sm mb-4" style={{ color: theme.text.muted }}>
                Configure your Autodarts camera system to automatically detect throws. Once configured here, 
                you can toggle camera mode on/off during games.
              </p>
              
              <AutodartsBridge />
            </div>

            <div className="p-4 rounded-lg border" style={{ background: theme.backgrounds.cardHex, borderColor: theme.borders.secondary }}>
              <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>How It Works</h3>
              <ul className="text-sm space-y-2" style={{ color: theme.text.muted }}>
                <li>• Configure your Autodarts credentials here (one time)</li>
                <li>• During games, toggle the camera bridge on/off as needed</li>
                <li>• When enabled, throws are automatically detected and recorded</li>
                <li>• When disabled, use manual scoring as normal</li>
              </ul>
            </div>
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.text.primary }}>
              Data Management
            </h2>

            <div className="p-4 rounded-lg border" style={{ background: theme.backgrounds.cardHex, borderColor: theme.borders.secondary }}>
              <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>Export Data</h3>
              <p className="text-sm mb-3" style={{ color: theme.text.muted }}>
                Download all your players and settings as a backup file.
              </p>
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded font-bold"
                style={{
                  background: theme.stateColors.active.color,
                  color: theme.text.primary
                }}
              >
                📥 Export Data
              </button>
            </div>

            <div className="p-4 rounded-lg border" style={{ background: theme.backgrounds.cardHex, borderColor: theme.borders.secondary }}>
              <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>Import Data</h3>
              <p className="text-sm mb-3" style={{ color: theme.text.muted }}>
                Restore from a previously exported backup file.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="block"
                style={{ color: theme.text.primary }}
              />
            </div>

            <div className="p-4 rounded-lg border border-red-500" style={{ background: theme.backgrounds.cardHex }}>
              <h3 className="font-bold mb-2" style={{ color: '#EF4444' }}>Clear All Data</h3>
              <p className="text-sm mb-3" style={{ color: theme.text.muted }}>
                This will delete all players, settings, and game history. This cannot be undone!
              </p>
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure? This will delete ALL data and cannot be undone!')) {
                    await PlayerManager.clearAllData();
                    setPlayers([]);
                    setSettings(PlayerManager.getSettings());
                    window.alert('All data cleared.');
                  }
                }}
                className="px-4 py-2 rounded font-bold"
                style={{
                  background: `linear-gradient(to right, ${theme.stateColors.bust.gradient})`,
                  color: theme.text.primary
                }}
              >
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;