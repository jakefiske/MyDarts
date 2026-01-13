import { useCallback } from 'react';

/**
 * Hook for haptic feedback on mobile devices
 * Provides different vibration patterns for various interactions
 */
export const useHaptics = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Light tap - for button presses, navigation
  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  
  // Medium tap - for score entry, selections
  const mediumTap = useCallback(() => vibrate(20), [vibrate]);
  
  // Heavy tap - for confirms, turn completions
  const heavyTap = useCallback(() => vibrate(30), [vibrate]);
  
  // Success pattern - for wins, achievements
  const success = useCallback(() => vibrate([10, 50, 10]), [vibrate]);
  
  // Error pattern - for misses, busts
  const error = useCallback(() => vibrate([50, 100, 50]), [vibrate]);

  return {
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
  };
};