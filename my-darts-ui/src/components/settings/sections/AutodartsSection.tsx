import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

export const AutodartsSection: React.FC = () => {
  const { theme } = useTheme();
  const [boardId, setBoardId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

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
        setStatus('✓ Saved successfully. Restart Autodarts service to apply.');
      } else {
        setStatus('✗ Failed to save configuration');
      }
    } catch (err) {
      setStatus('✗ Error saving configuration');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!boardId || !apiKey) {
      setTestResult('⚠️ Please enter Board ID and API Key first');
      return;
    }

    setTesting(true);
    setTestResult('Testing connection...');
    
    try {
      const res = await fetch('/api/autodarts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, apiKey })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setTestResult(`✓ Connection successful! Board: ${data.boardName || 'Unknown'}`);
      } else {
        setTestResult(`✗ Connection failed: ${data.message}`);
      }
    } catch (err) {
      setTestResult('✗ Connection test failed');
    }
    setTesting(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Autodarts Configuration</h2>
      
      {/* Instructions */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex, borderLeft: `4px solid ${theme.stateColors.active.color}` }}>
        <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>📋 How to Get Your Credentials</h3>
        <ol className="text-sm space-y-2" style={{ color: theme.text.muted }}>
          <li><strong>1.</strong> Go to <a href="https://play.autodarts.io" target="_blank" rel="noopener noreferrer" style={{ color: theme.stateColors.active.color }}>play.autodarts.io</a> and log in</li>
          <li><strong>2.</strong> Click on <strong>Settings</strong> (gear icon)</li>
          <li><strong>3.</strong> Select <strong>Board Settings</strong></li>
          <li><strong>4.</strong> Find your board and click <strong>View Details</strong></li>
          <li><strong>5.</strong> Copy the <strong>Board ID</strong> and <strong>API Key</strong></li>
          <li><strong>6.</strong> Paste them below and click <strong>Save</strong></li>
        </ol>
        <div className="mt-3 p-2 rounded text-xs" style={{ background: theme.backgrounds.baseHex, color: theme.text.muted }}>
          💡 <strong>Tip:</strong> If you can't find your API key, you may need to regenerate it in Board Settings.
        </div>
      </div>

      {/* Configuration Form */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Credentials</h3>

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
              className="w-full px-3 py-2 rounded-lg font-mono text-sm"
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
              className="w-full px-3 py-2 rounded-lg font-mono text-sm"
              style={{ 
                background: theme.backgrounds.baseHex, 
                color: theme.text.primary,
                border: `1px solid ${theme.borders.secondary}`
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !boardId || !apiKey}
              className="flex-1 py-3 rounded-lg font-bold"
              style={{ 
                background: theme.backgrounds.baseHex,
                color: theme.text.primary,
                border: `2px solid ${theme.borders.secondary}`,
                opacity: (testing || !boardId || !apiKey) ? 0.5 : 1
              }}
            >
              {testing ? '⏳ Testing...' : '🔍 Test Connection'}
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !boardId || !apiKey}
              className="flex-1 py-3 rounded-lg font-bold"
              style={{ 
                background: theme.stateColors.active.color, 
                color: theme.backgrounds.baseHex,
                opacity: (saving || !boardId || !apiKey) ? 0.5 : 1
              }}
            >
              {saving ? '⏳ Saving...' : '💾 Save Configuration'}
            </button>
          </div>

          {testResult && (
            <div 
              className="p-3 rounded-lg text-center text-sm"
              style={{ 
                background: theme.backgrounds.baseHex,
                color: testResult.startsWith('✓') ? '#22C55E' : testResult.startsWith('⚠️') ? '#F59E0B' : '#EF4444'
              }}
            >
              {testResult}
            </div>
          )}

          {status && (
            <div 
              className="p-3 rounded-lg text-center text-sm"
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