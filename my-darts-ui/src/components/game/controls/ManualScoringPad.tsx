import React, { useState } from 'react';
import { useTheme } from '../../../hooks/useThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

interface ManualScoringPadProps {
  onThrow: (segment: string, multiplier: number, value: number) => void;
  disabled?: boolean;
  editingThrowIndex: number | null;
  highlightNumbers?: number[]; // Optional: highlight specific numbers (e.g., current target in Around the Clock)
  compact?: boolean; // Optional: smaller layout for desktop sidebars
}

/**
 * Reusable manual scoring pad component
 * Handles number grid, multiplier selection, bulls, and miss
 * Respects editingThrowIndex to prevent new throws during edit mode
 */
export const ManualScoringPad: React.FC<ManualScoringPadProps> = ({
  onThrow,
  disabled = false,
  editingThrowIndex,
  highlightNumbers = [],
  compact = false
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);

  // Dartboard number order (clockwise from top)
  const numbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

  const handleNumberClick = (num: number) => {
    if (disabled) return;
    
    const baseSegment = num === 25 ? '25' : num.toString();
    const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';
    const segment = prefix + baseSegment;
    
    haptics.mediumTap();
    onThrow(segment, multiplier, num); // Send base value, not multiplied
    setMultiplier(1); // Reset multiplier after throw
  };

  const handleBullClick = (isDouble: boolean) => {
    if (disabled) return;
    
    haptics.mediumTap();
    if (isDouble) {
      onThrow('DB', 2, 50);
    } else {
      onThrow('SB', 1, 25);
    }
  };

  const handleMissClick = () => {
    if (disabled) return;
    
    haptics.error();
    onThrow('MISS', 0, 0);
    setMultiplier(1);
  };

  // Don't show manual scoring during edit mode
  if (editingThrowIndex !== null) {
    return null;
  }

  const buttonSize = compact ? 'py-1.5 text-xs' : 'py-2 text-sm';
  const headerSize = compact ? 'text-sm' : 'text-base';

  return (
    <div className="space-y-2">
      {/* Multiplier selector */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            haptics.lightTap();
            setMultiplier(1);
          }}
          disabled={disabled}
          className={`${buttonSize} rounded-lg font-bold transition-all active:scale-95 border-2`}
          style={{
            background: multiplier === 1 
              ? `linear-gradient(to right, ${theme.stateColors.active.gradient})`
              : theme.backgrounds.cardHex,
            borderColor: multiplier === 1 
              ? theme.stateColors.active.border 
              : theme.borders.secondary,
            color: theme.text.primary,
            opacity: disabled ? 0.5 : 1
          }}
        >
          Single
        </button>
        <button
          onClick={() => {
            haptics.lightTap();
            setMultiplier(2);
          }}
          disabled={disabled}
          className={`${buttonSize} rounded-lg font-bold transition-all active:scale-95 border-2`}
          style={{
            background: multiplier === 2 
              ? `linear-gradient(to right, ${theme.stateColors.active.gradient})`
              : theme.backgrounds.cardHex,
            borderColor: multiplier === 2 
              ? theme.stateColors.active.border 
              : theme.borders.secondary,
            color: theme.text.primary,
            opacity: disabled ? 0.5 : 1
          }}
        >
          Double
        </button>
        <button
          onClick={() => {
            haptics.lightTap();
            setMultiplier(3);
          }}
          disabled={disabled}
          className={`${buttonSize} rounded-lg font-bold transition-all active:scale-95 border-2`}
          style={{
            background: multiplier === 3 
              ? `linear-gradient(to right, ${theme.stateColors.active.gradient})`
              : theme.backgrounds.cardHex,
            borderColor: multiplier === 3 
              ? theme.stateColors.active.border 
              : theme.borders.secondary,
            color: theme.text.primary,
            opacity: disabled ? 0.5 : 1
          }}
        >
          Triple
        </button>
      </div>

      {/* Number grid 1-20 */}
      <div className="grid grid-cols-5 gap-1.5">
        {numbers.map((num) => {
          const isHighlighted = highlightNumbers.includes(num);
          
          return (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={disabled}
              className={`${buttonSize} rounded-lg font-black transition-all active:scale-95 border-2`}
              style={{
                background: isHighlighted 
                  ? `linear-gradient(to right, ${theme.stateColors.active.gradient})`
                  : theme.backgrounds.cardHex,
                borderColor: isHighlighted 
                  ? theme.stateColors.active.border 
                  : theme.borders.primary,
                color: isHighlighted 
                  ? theme.text.primary 
                  : theme.playerColors[0].primary,
                opacity: disabled ? 0.5 : 1
              }}
            >
              {multiplier === 2 ? 'D' : multiplier === 3 ? 'T' : ''}{num}
            </button>
          );
        })}
      </div>

      {/* Bull + Miss */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleBullClick(false)}
          disabled={disabled}
          className={`${buttonSize} rounded-lg font-bold transition-all active:scale-95 border-2`}
          style={{
            background: theme.backgrounds.cardHex,
            borderColor: theme.borders.primary,
            color: theme.playerColors[1].primary,
            opacity: disabled ? 0.5 : 1
          }}
        >
          SB (25)
        </button>
        <button
          onClick={() => handleBullClick(true)}
          disabled={disabled}
          className={`${buttonSize} rounded-lg font-bold transition-all active:scale-95 border-2`}
          style={{
            background: theme.backgrounds.cardHex,
            borderColor: theme.borders.primary,
            color: theme.playerColors[2].primary,
            opacity: disabled ? 0.5 : 1
          }}
        >
          DB (50)
        </button>
        <button
          onClick={handleMissClick}
          disabled={disabled}
          className={`${buttonSize} rounded-lg font-bold transition-all active:scale-95 border-2`}
          style={{
            background: `linear-gradient(to right, ${theme.stateColors.bust.gradient.split(' ').map(c => c.replace('from-', '').replace('to-', '')).join(', ')})`,
            borderColor: theme.stateColors.bust.border,
            color: theme.text.primary,
            opacity: disabled ? 0.5 : 1
          }}
        >
          MISS
        </button>
      </div>
    </div>
  );
};