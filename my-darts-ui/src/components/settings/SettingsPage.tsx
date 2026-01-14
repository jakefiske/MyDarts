import React, { useState } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import {
  PlayersSection,
  GameDefaultsSection,
  ThemeSection,
  SoundSection,
  CamerasSection,
  AutodartsSection,
  BoardManagerSection,
  SystemSection,
  BluetoothSection,
  SpotifySection,
  DataSection,
} from './sections';

interface SettingsPageProps {
  onBack: () => void;
}

type Section = 'players' | 'game' | 'theme' | 'sound' | 'cameras' | 'autodarts' | 'boardmanager' | 'system' | 'bluetooth' | 'spotify' | 'data';

interface SettingsGroup {
  id: string;
  label: string;
  sections: { id: Section; label: string; icon: string }[];
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>('players');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const groups: SettingsGroup[] = [
    {
      id: 'game',
      label: 'Game',
      sections: [
        { id: 'players', label: 'Players', icon: '👥' },
        { id: 'game', label: 'Game Defaults', icon: '🎯' },
        { id: 'cameras', label: 'Throw Detection', icon: '📷' },
      ]
    },
    {
      id: 'autodarts',
      label: 'Autodarts',
      sections: [
        { id: 'autodarts', label: 'Autodarts Play', icon: '🎯' },
        { id: 'boardmanager', label: 'Board Setup', icon: '⚙️' },
      ]
    },
    {
      id: 'appearance',
      label: 'Appearance',
      sections: [
        { id: 'theme', label: 'Theme', icon: '🎨' },
        { id: 'sound', label: 'Sound', icon: '🔊' },
      ]
    },
    {
      id: 'device',
      label: 'Device',
      sections: [
        { id: 'bluetooth', label: 'Bluetooth', icon: '📶' },
        { id: 'spotify', label: 'Spotify', icon: '🎵' },
        { id: 'system', label: 'System', icon: '🖥️' },
        { id: 'data', label: 'Data', icon: '💾' },
      ]
    },
  ];

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'players': return <PlayersSection />;
      case 'game': return <GameDefaultsSection />;
      case 'theme': return <ThemeSection />;
      case 'sound': return <SoundSection />;
      case 'cameras': return <CamerasSection />;
      case 'autodarts': return <AutodartsSection />;
      case 'boardmanager': return <BoardManagerSection />;
      case 'system': return <SystemSection />;
      case 'bluetooth': return <BluetoothSection />;
      case 'spotify': return <SpotifySection />;
      case 'data': return <DataSection />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex" style={{ backgroundColor: theme.backgrounds.baseHex }}>
      {/* Sidebar */}
      <div 
        className="w-56 flex-shrink-0 border-r flex flex-col overflow-hidden"
        style={{ borderColor: theme.borders.secondary, background: theme.backgrounds.cardHex }}
      >
        {/* Header */}
        <div className="p-3 border-b" style={{ borderColor: theme.borders.secondary }}>
          <button
            onClick={onBack}
            className="text-sm opacity-70 hover:opacity-100 transition"
            style={{ color: theme.text.primary }}
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold mt-1" style={{ color: theme.text.primary }}>
            Settings
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-auto py-1">
          {groups.map(group => {
            const isCollapsed = collapsedGroups.has(group.id);
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider"
                  style={{ color: theme.text.muted }}
                >
                  {group.label}
                  <span style={{ fontSize: '10px' }}>{isCollapsed ? '▶' : '▼'}</span>
                </button>
                {!isCollapsed && (
                  <div>
                    {group.sections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className="w-full px-3 py-2 flex items-center gap-2 text-left text-sm transition"
                        style={{
                          background: activeSection === section.id ? `${theme.stateColors.active.color}22` : 'transparent',
                          color: activeSection === section.id ? theme.stateColors.active.color : theme.text.primary,
                          borderLeft: activeSection === section.id ? `2px solid ${theme.stateColors.active.color}` : '2px solid transparent'
                        }}
                      >
                        <span>{section.icon}</span>
                        <span>{section.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;