import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';
import { PlayerManager, SavedPlayer } from '../../../utils/PlayerManager';

export const PlayersSection: React.FC = () => {
  const { theme } = useTheme();
  const [players, setPlayers] = useState<SavedPlayer[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<SavedPlayer | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

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

  return (
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
  );
};