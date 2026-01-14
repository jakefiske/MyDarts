import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import {
  PlayersSection,
  GameDefaultsSection,
  ThemeSection,
  SoundSection,
  CamerasSection,
  SystemSection,
  BluetoothSection,
  SpotifySection,
  DataSection,
} from './sections';

interface SettingsPageProps {
  onBack: () => void;
}

type Section = 'players' | 'game' | 'theme' | 'sound' | 'cameras' | 'system' | 'bluetooth' | 'spotify' | 'data';

interface SystemStatus {
  hostname: string;
  ipAddresses: string[];
  internet: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>('players');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Fetch system status for footer
  const fetchSystemStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  }, []);

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

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

  const renderSection = () => {
    switch (activeSection) {
      case 'players': return <PlayersSection />;
      case 'game': return <GameDefaultsSection />;
      case 'theme': return <ThemeSection />;
      case 'sound': return <SoundSection />;
      case 'cameras': return <CamerasSection />;
      case 'system': return <SystemSection />;
      case 'bluetooth': return <BluetoothSection />;
      case 'spotify': return <SpotifySection />;
      case 'data': return <DataSection />;
      default: return null;
    }
  };

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
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;