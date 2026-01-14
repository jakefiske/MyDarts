import React, { useState } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';
import { PlayerManager } from '../../../utils/PlayerManager';

export const DataSection: React.FC = () => {
  const { theme } = useTheme();

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
          window.location.reload();
        } else {
          window.alert('Failed to import data.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Delete ALL data? This cannot be undone!')) {
      await PlayerManager.clearAllData();
      window.location.reload();
    }
  };

  return (
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
          onClick={handleClearAll}
          className="px-4 py-2 rounded-lg font-bold"
          style={{ background: '#EF4444', color: 'white' }}
        >
          🗑️ Clear All
        </button>
      </div>
    </div>
  );
};