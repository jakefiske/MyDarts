import React from 'react';
import { soundManager } from '../utils/SoundManager';

interface SoundSettingsProps {
  onClose: () => void;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ onClose }) => {
  const [enabled, setEnabled] = React.useState(soundManager.isEnabled());
  const [volume, setVolume] = React.useState(soundManager.getVolume() * 100);

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    soundManager.setEnabled(newEnabled);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume / 100);
  };

  const testSound = () => {
    soundManager.play('oneEighty');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-96">
        <h2 className="text-2xl font-bold text-green-400 mb-6">🔊 Sound Settings</h2>
        
        {/* Enable/Disable */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-300">Sound Effects</span>
          <button
            onClick={handleToggle}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              enabled 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Volume */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-300">Volume</span>
            <span className="text-gray-400">{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Test Button */}
        <button
          onClick={testSound}
          className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold mb-4 transition"
        >
          🎤 Test Sound
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SoundSettings;