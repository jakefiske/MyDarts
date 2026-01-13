import React from 'react';
import { useTheme } from '../../../hooks/useThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';

interface EditingIndicatorProps {
  editingThrowIndex: number | null;
  onChangToMiss: () => void;
}

/**
 * Shows visual indicator when editing a throw
 * Provides "Change to MISS" button
 */
export const EditingIndicator: React.FC<EditingIndicatorProps> = ({
  editingThrowIndex,
  onChangToMiss
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  if (editingThrowIndex === null) {
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
      <div className="text-xl font-bold mb-2">
        Editing Dart {editingThrowIndex + 1}
      </div>
      <div className="text-sm mb-3">
        Click the correct segment on the board
      </div>
      <button
        onClick={() => {
          haptics.error();
          onChangToMiss();
        }}
        className="w-full min-h-touch py-3 rounded-lg font-bold transition-all active:scale-95 border-2"
        style={{
          background: `linear-gradient(to right, ${theme.stateColors.bust.gradient.split(' ').map(c => c.replace('from-', '').replace('to-', '')).join(', ')})`,
          borderColor: theme.stateColors.bust.border,
          color: theme.text.primary
        }}
      >
        ✕ Change to MISS
      </button>
    </div>
  );
};