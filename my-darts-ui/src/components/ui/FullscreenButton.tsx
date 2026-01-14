import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useThemeContext';

export const FullscreenButton: React.FC = () => {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="fixed bottom-4 right-4 p-4 rounded-full shadow-lg z-50"
      style={{
        background: theme.stateColors.active.color,
        color: theme.backgrounds.baseHex,
      }}
      title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen'}
    >
      {isFullscreen ? (
        <span className="text-2xl">⤢</span>
      ) : (
        <span className="text-2xl">⛶</span>
      )}
    </button>
  );
};