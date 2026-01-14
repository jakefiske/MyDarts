import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

export const AutodartsSection: React.FC = () => {
  const { theme } = useTheme();
  const [boardId, setBoardId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Load current config
    fetch('/api/autodarts/config')
      .then(r => r.json())
      .then(data => {
        setBoardId(data.boardId || '');
        setApiKey(data.apiKey || '');
      })
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/autodarts/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, apiKey })
      });
      
      if (res.ok) {
        setStatus('✓ Saved successfully. Restart services to apply.');
      } else {
        setStatus('✗ Failed to save configuration');
      }
    } catch (err) {
      setStatus('✗ Error saving configuration');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Autodarts Configuration</h2>
      
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <p className="mb-4 text-sm" style={{ color: theme.text.muted }}>
          Configure your Autodarts board credentials. Get these from play.autodarts.io → Board Settings.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-bold" style={{ color: theme.text.primary }}>
              Board ID
            </label>
            <input
              type="text"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="64c91a49-14c0-46fb-ad48-3fe44f8b0217"
              className="w-full px-3 py-2 rounded-lg"
              style={{ 
                background: theme.backgrounds.baseHex, 
                color: theme.text.primary,
                border: `1px solid ${theme.borders.secondary}`
              }}
            />
          </div>

          <div>
            <label className="block mb-2 font-bold" style={{ color: theme.text.primary }}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="tMEzAps4dyO69sm4nFZsIBQH_4dPa3c8"
              className="w-full px-3 py-2 rounded-lg"
              style={{ 
                background: theme.backgrounds.baseHex, 
                color: theme.text.primary,
                border: `1px solid ${theme.borders.secondary}`
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !boardId || !apiKey}
            className="w-full py-3 rounded-lg font-bold"
            style={{ 
              background: theme.stateColors.active.color, 
              color: theme.backgrounds.baseHex,
              opacity: (saving || !boardId || !apiKey) ? 0.5 : 1
            }}
          >
            {saving ? '⏳ Saving...' : '💾 Save Configuration'}
          </button>

          {status && (
            <div 
              className="p-3 rounded-lg text-center"
              style={{ 
                background: theme.backgrounds.baseHex,
                color: status.startsWith('✓') ? '#22C55E' : '#EF4444'
              }}
            >
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};