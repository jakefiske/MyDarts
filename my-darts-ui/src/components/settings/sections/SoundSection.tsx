import React, { useState } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';
import { soundManager } from '../../../utils/SoundManager';

export const SoundSection: React.FC = () => {
  const { theme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [soundVolume, setSoundVolume] = useState(soundManager.getVolume() * 100);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>Sound</h2>
      
      <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
        <div className="flex items-center justify-between mb-6">
          <span className="font-medium" style={{ color: theme.text.primary }}>Sound Effects</span>
          <button
            onClick={() => {
              const newEnabled = !soundEnabled;
              setSoundEnabled(newEnabled);
              soundManager.setEnabled(newEnabled);
            }}
            className="px-6 py-2 rounded-lg font-bold transition-all"
            style={{
              background: soundEnabled ? theme.stateColors.active.color : theme.backgrounds.baseHex,
              color: soundEnabled ? theme.backgrounds.baseHex : theme.text.muted,
              border: `2px solid ${soundEnabled ? theme.stateColors.active.border : theme.borders.secondary}`
            }}
          >
            {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span style={{ color: theme.text.primary }}>Volume</span>
            <span style={{ color: theme.text.muted }}>{Math.round(soundVolume)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={soundVolume}
            onChange={(e) => {
              const vol = parseInt(e.target.value);
              setSoundVolume(vol);
              soundManager.setVolume(vol / 100);
            }}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: theme.backgrounds.baseHex }}
          />
        </div>

        <button
          onClick={() => soundManager.play('oneEighty')}
          className="w-full py-3 rounded-lg font-bold"
          style={{ background: theme.backgrounds.baseHex, color: theme.text.primary, border: `1px solid ${theme.borders.secondary}` }}
        >
          🎤 Test Sound
        </button>
      </div>
    </div>
  );
};