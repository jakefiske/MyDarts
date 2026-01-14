import React from 'react';
import { useTheme } from '../../../hooks/useThemeContext';

type ThemeName = 'proDark' | 'broadcast' | 'light';

export const ThemeSection: React.FC = () => {
  const { theme, themeName, setTheme } = useTheme();

  const themeOptions: { key: ThemeName; name: string; icon: string; desc: string }[] = [
    { key: 'proDark', name: 'Pro Dark', icon: '🎯', desc: 'Professional dark theme' },
    { key: 'broadcast', name: 'Broadcast', icon: '📺', desc: 'High-energy for tournaments' },
    { key: 'light', name: 'Light', icon: '☀️', desc: 'Clean light theme' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Theme</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themeOptions.map(t => (
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
  );
};