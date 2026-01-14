import React from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';

interface SpotifySetupProps {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  saving: boolean;
  saveStatus: string | null;
  onClientIdChange: (value: string) => void;
  onClientSecretChange: (value: string) => void;
  onSave: () => void;
}

export const SpotifySetup: React.FC<SpotifySetupProps> = ({
  clientId,
  clientSecret,
  redirectUri,
  saving,
  saveStatus,
  onClientIdChange,
  onClientSecretChange,
  onSave
}) => {
  const { theme } = useTheme();

  return (
    <>
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex, borderLeft: `4px solid ${theme.stateColors.active.color}` }}>
        <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>📋 How to Get Your API Credentials</h3>
        <ol className="text-sm space-y-2" style={{ color: theme.text.muted }}>
          <li><strong>1.</strong> Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: theme.stateColors.active.color }}>developer.spotify.com/dashboard</a></li>
          <li><strong>2.</strong> Log in with your Spotify account</li>
          <li><strong>3.</strong> Click <strong>Create App</strong></li>
          <li><strong>4.</strong> Fill in:
            <ul className="ml-4 mt-1 space-y-1">
              <li>• App name: <code style={{ background: theme.backgrounds.baseHex, padding: '2px 6px', borderRadius: '4px' }}>MyDarts</code></li>
              <li>• App description: <code style={{ background: theme.backgrounds.baseHex, padding: '2px 6px', borderRadius: '4px' }}>Darts scoring with music</code></li>
              <li>• Redirect URI: <code style={{ background: theme.backgrounds.baseHex, padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{redirectUri}</code></li>
            </ul>
          </li>
          <li><strong>5.</strong> Check <strong>Web API</strong> and agree to terms</li>
          <li><strong>6.</strong> Click <strong>Save</strong>, then click <strong>Settings</strong></li>
          <li><strong>7.</strong> Copy <strong>Client ID</strong> and <strong>Client Secret</strong></li>
          <li><strong>8.</strong> Paste them below and click <strong>Save</strong></li>
        </ol>
      </div>

      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-2" style={{ color: theme.text.primary }}>Redirect URI</h3>
        <p className="text-sm mb-2" style={{ color: theme.text.muted }}>
          Copy this exact URL into your Spotify App settings:
        </p>
        <div className="p-3 rounded-lg font-mono text-sm flex items-center justify-between" style={{ background: theme.backgrounds.baseHex, color: theme.text.primary }}>
          <span>{redirectUri}</span>
          <button
            onClick={() => navigator.clipboard.writeText(redirectUri)}
            className="px-3 py-1 rounded text-xs font-bold"
            style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex }}
          >
            📋 Copy
          </button>
        </div>
      </div>

      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>API Credentials</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-bold" style={{ color: theme.text.primary }}>Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => onClientIdChange(e.target.value)}
              placeholder="0f18e5462094430bb67b20e8254ef272"
              className="w-full px-3 py-2 rounded-lg font-mono text-sm"
              style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
            />
          </div>
          <div>
            <label className="block mb-2 font-bold" style={{ color: theme.text.primary }}>Client Secret</label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => onClientSecretChange(e.target.value)}
              placeholder="Enter client secret..."
              className="w-full px-3 py-2 rounded-lg font-mono text-sm"
              style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
            />
          </div>
          <button
            onClick={onSave}
            disabled={saving || !clientId || !clientSecret}
            className="w-full py-3 rounded-lg font-bold"
            style={{ background: theme.stateColors.active.color, color: theme.backgrounds.baseHex, opacity: (saving || !clientId || !clientSecret) ? 0.5 : 1 }}
          >
            {saving ? '⏳ Saving...' : '💾 Save Credentials'}
          </button>
          {saveStatus && (
            <div className="p-3 rounded-lg text-center" style={{ background: theme.backgrounds.baseHex, color: saveStatus.startsWith('✓') ? '#22C55E' : '#EF4444' }}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </>
  );
};