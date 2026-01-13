import { useEffect, useState, useRef } from 'react';

/**
 * Hook to animate score changes
 * Returns true when the value changes, false after animation completes
 */
export const useScoreAnimation = (value: string | number) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value && value !== '' && value !== 0) {
      setIsAnimating(true);
      prevValue.current = value;
      
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return isAnimating;
};