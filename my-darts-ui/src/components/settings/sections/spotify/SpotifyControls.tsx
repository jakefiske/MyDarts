import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../hooks/useThemeContext';

interface SpotifyControlsProps {
  isPlaying: boolean;
  currentVolume: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
}

export const SpotifyControls: React.FC<SpotifyControlsProps> = ({
  isPlaying,
  currentVolume,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onVolumeChange
}) => {
  const { theme } = useTheme();
  const [volume, setVolume] = useState(currentVolume);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setVolume(currentVolume);
    }
  }, [currentVolume, isDragging]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
  };

  const handleVolumeCommit = () => {
    setIsDragging(false);
    onVolumeChange(volume);
  };

  return (
    <div className="p-4 rounded-lg" style={{ background: theme.backgrounds.cardHex }}>
      <h3 className="font-bold mb-4" style={{ color: theme.text.primary }}>Playback Controls</h3>
      
      {/* Transport Controls */}
      <div className="flex gap-3 justify-center mb-6">
        <button
          onClick={onPrevious}
          className="p-4 rounded-lg font-bold text-3xl flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ 
            background: theme.backgrounds.baseHex, 
            color: theme.text.primary,
            width: '70px',
            height: '70px'
          }}
        >
          ⏮️
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-4 rounded-lg font-bold text-4xl flex items-center justify-center transition-opacity hover:opacity-90"
          style={{ 
            background: theme.stateColors.active.color, 
            color: theme.backgrounds.baseHex,
            width: '90px',
            height: '70px'
          }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          onClick={onNext}
          className="p-4 rounded-lg font-bold text-3xl flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ 
            background: theme.backgrounds.baseHex, 
            color: theme.text.primary,
            width: '70px',
            height: '70px'
          }}
        >
          ⏭️
        </button>
      </div>

      {/* Volume Control */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-bold" style={{ color: theme.text.primary }}>
            🔊 Volume
          </label>
          <span className="text-sm font-mono" style={{ color: theme.text.muted }}>
            {volume}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleVolumeCommit}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleVolumeCommit}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${theme.stateColors.active.color} 0%, ${theme.stateColors.active.color} ${volume}%, ${theme.backgrounds.baseHex} ${volume}%, ${theme.backgrounds.baseHex} 100%)`
          }}
        />
      </div>
    </div>
  );
};