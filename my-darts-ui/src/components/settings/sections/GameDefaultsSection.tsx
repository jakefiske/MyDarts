import React, { useState } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';
import { PlayerManager, AppSettings } from '../../../utils/PlayerManager';

export const GameDefaultsSection: React.FC = () => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(PlayerManager.getSettings());

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    PlayerManager.updateSettings({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Game Defaults</h2>

      {/* Mickey Mouse */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-4" style={{ color: theme.text.primary }}>Mickey Mouse Cricket</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm" style={{ color: theme.text.muted }}>Default Range</label>
            <div className="flex gap-2">
              {[10, 11, 12, 15].map(num => (
                <button
                  key={num}
                  onClick={() => handleSettingChange('defaultMickeyMouseRange', num)}
                  className="flex-1 py-2 rounded font-bold"
                  style={{
                    background: settings.defaultMickeyMouseRange === num ? theme.stateColors.active.color : theme.backgrounds.baseHex,
                    color: theme.text.primary,
                    border: `2px solid ${settings.defaultMickeyMouseRange === num ? theme.stateColors.active.border : theme.borders.secondary}`
                  }}
                >
                  20-{num}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.defaultIncludeDoubles} onChange={(e) => handleSettingChange('defaultIncludeDoubles', e.target.checked)} className="w-5 h-5" />
            <span style={{ color: theme.text.primary }}>Include Doubles</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.defaultIncludeTriples} onChange={(e) => handleSettingChange('defaultIncludeTriples', e.target.checked)} className="w-5 h-5" />
            <span style={{ color: theme.text.primary }}>Include Triples</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.defaultIncludeBeds} onChange={(e) => handleSettingChange('defaultIncludeBeds', e.target.checked)} className="w-5 h-5" />
            <span style={{ color: theme.text.primary }}>Include Beds</span>
          </label>
        </div>
      </div>

      {/* X01 */}
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <h3 className="font-bold mb-4" style={{ color: theme.text.primary }}>X01</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm" style={{ color: theme.text.muted }}>Default Starting Score</label>
            <div className="flex gap-2">
              {[301, 501, 701].map(score => (
                <button
                  key={score}
                  onClick={() => handleSettingChange('defaultX01Score', score)}
                  className="flex-1 py-2 rounded font-bold"
                  style={{
                    background: settings.defaultX01Score === score ? theme.stateColors.active.color : theme.backgrounds.baseHex,
                    color: theme.text.primary,
                    border: `2px solid ${settings.defaultX01Score === score ? theme.stateColors.active.border : theme.borders.secondary}`
                  }}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.defaultDoubleIn} onChange={(e) => handleSettingChange('defaultDoubleIn', e.target.checked)} className="w-5 h-5" />
            <span style={{ color: theme.text.primary }}>Double In</span>
          </label>
        </div>
      </div>
    </div>
  );
};