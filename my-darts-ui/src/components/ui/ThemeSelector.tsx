import React from 'react';
import { themes } from '../../themes';

type ThemeName = 'proDark' | 'broadcast' | 'light';

interface ThemeSelectorProps {
  currentTheme: ThemeName;
  onThemeChange: (themeName: ThemeName) => void;
  onClose: () => void;
}

const themeDescriptions = {
  proDark: {
    name: 'Pro Dark',
    description: 'Professional dark theme optimized for extended play',
    preview: ['#FF1A8C', '#00C2E0', '#FFA000', '#00E676', '#9C27B0', '#FF4444'],
    bestFor: 'Default theme, serious play, streaming',
    icon: '🎯',
  },
  broadcast: {
    name: 'Broadcast',
    description: 'High-energy theme for tournaments and entertainment',
    preview: ['#FF0080', '#00D9FF', '#FFB800', '#00FF85', '#A855F7', '#FF3333'],
    bestFor: 'Tournaments, parties, high-energy events',
    icon: '📺',
  },
  light: {
    name: 'Light',
    description: 'Clean light theme for bright environments',
    preview: ['#DC2626', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'],
    bestFor: 'Daytime play, bright rooms, accessibility',
    icon: '☀️',
  },
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 max-w-4xl w-full border-2 border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-black text-white" 
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            🎨 Choose Your Theme
          </h2>
          <button
            onClick={onClose}
            className="text-4xl text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-slate-400 mb-6 md:mb-8">
          Three carefully crafted themes, each optimized for different scenarios.
        </p>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {(Object.entries(themeDescriptions) as [ThemeName, typeof themeDescriptions[ThemeName]][]).map(([key, theme]) => {
            const isActive = currentTheme === key;
            
            return (
              <button
                key={key}
                onClick={() => onThemeChange(key)}
                className={`
                  text-left p-6 rounded-xl transition-all duration-300 border-4
                  ${isActive 
                    ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-400 scale-105 shadow-2xl shadow-green-500/20' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  }
                `}
              >
                {/* Icon and Active Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-4xl">{theme.icon}</div>
                  {isActive && (
                    <div className="bg-green-500 rounded-full px-3 py-1 text-xs font-bold text-white">
                      ACTIVE
                    </div>
                  )}
                </div>

                {/* Theme Name */}
                <h3 className="text-2xl font-black text-white mb-2">
                  {theme.name}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-4">
                  {theme.description}
                </p>

                {/* Color Preview */}
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {theme.preview.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-7 h-7 rounded-lg border-2 border-slate-600"
                      style={{ backgroundColor: color }}
                      title={`Player ${idx + 1} color`}
                    />
                  ))}
                </div>

                {/* Best For */}
                <div className="text-xs text-slate-500">
                  <span className="font-semibold">Best for:</span> {theme.bestFor}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-6 md:mt-8 p-4 bg-blue-900/30 rounded-xl border-2 border-blue-700">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-bold text-blue-300 mb-1">About These Themes</div>
              <div className="text-sm text-slate-300">
                Each theme has been carefully designed and tested for readability, contrast, and usability. 
                Your selection is saved automatically and applies across all game modes.
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 md:mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 px-8 py-3 rounded-xl font-bold transition-all shadow-lg text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};