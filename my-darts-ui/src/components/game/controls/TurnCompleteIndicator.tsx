import React from 'react';
import { useTheme } from '../../../hooks/useThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

interface TurnCompleteIndicatorProps {
  turnComplete: boolean;
  editingThrowIndex: number | null;
  onConfirmTurn: () => void;
  hideIfPendingAllocation?: boolean; // Don't show if bed/shanghai allocation pending
}

/**
 * Shows "Remove Darts" indicator when turn is complete
 */
export const TurnCompleteIndicator: React.FC<TurnCompleteIndicatorProps> = ({
  turnComplete,
  editingThrowIndex,
  onConfirmTurn,
  hideIfPendingAllocation = false
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  // Don't show if not complete, editing, or allocation pending
  if (!turnComplete || editingThrowIndex !== null || hideIfPendingAllocation) {
    return null;
  }

  return (
    <div 
      className="rounded-xl p-4 text-center border-2"
      style={{
        background: `linear-gradient(to right, ${theme.stateColors.winner.gradient.split(' ').map(c => c.replace('from-', '').replace('via-', '').replace('to-', '')).join(', ')})`,
        borderColor: theme.stateColors.winner.border,
        color: theme.text.primary
      }}
    >
      <div className="text-xl font-bold mb-3">
        Remove Darts from Board
      </div>
      <button
        onClick={() => {
          haptics.heavyTap();
          onConfirmTurn();
        }}
        className="min-h-touch px-8 py-4 rounded-lg font-bold text-lg transition-all active:scale-95 border-2"
        style={{
          background: theme.backgrounds.base.split(' ')[0].replace('from-', ''),
          borderColor: theme.borders.primary,
          color: theme.stateColors.winner.border
        }}
      >
        ✓ Darts Removed
      </button>
    </div>
  );
};