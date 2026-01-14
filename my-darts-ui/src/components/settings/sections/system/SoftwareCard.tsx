import React from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';

interface VersionInfo {
  commit: string;
  date: string;
  branch: string;
}

interface SoftwareCardProps {
  version: VersionInfo | null;
  loading: boolean;
  updateStatus: string | null;
  onUpdate: () => void;
  onRunSetup: () => void;
}

export const SoftwareCard: React.FC<SoftwareCardProps> = ({
  version,
  loading,
  updateStatus,
  onUpdate,
  onRunSetup
}) => {
  const { theme } = useTheme();

  return (
    <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
      <h3 className="font-bold mb-3" style={{ color: theme.text.primary }}>Software</h3>
      {version && (
        <div className="text-sm mb-3" style={{ color: theme.text.muted }}>
          <span>Version: </span>
          <span style={{ color: theme.text.primary }}>{version.commit}</span>
          <span className="mx-2">•</span>
          <span>{version.branch}</span>
          <span className="mx-2">•</span>
          <span>{version.date}</span>
        </div>
      )}
      
      <div className="space-y-2">
        <button
          onClick={onUpdate}
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold"
          style={{ 
            background: theme.stateColors.active.color, 
            color: theme.backgrounds.baseHex, 
            opacity: loading ? 0.5 : 1 
          }}
        >
          {loading ? '⏳ Updating...' : '⬇️ Update from GitHub'}
        </button>
        
        <button
          onClick={onRunSetup}
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold"
          style={{ 
            background: '#3B82F6', 
            color: 'white', 
            opacity: loading ? 0.5 : 1 
          }}
        >
          🔧 Run Setup Script
        </button>
      </div>
      
      {updateStatus && (
        <div className="mt-2 text-sm" style={{ color: theme.text.muted }}>{updateStatus}</div>
      )}
    </div>
  );
};