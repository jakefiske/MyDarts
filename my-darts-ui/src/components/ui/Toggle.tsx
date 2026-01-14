import React from 'react';
import { useTheme } from '../../hooks/useThemeContext';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false }) => {
  const { theme } = useTheme();

  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200"
        style={{
          backgroundColor: checked ? theme.stateColors.active.color : theme.backgrounds.baseHex,
          border: `2px solid ${checked ? theme.stateColors.active.border : theme.borders.secondary}`
        }}
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full shadow-md transition-transform duration-200"
          style={{
            backgroundColor: checked ? theme.backgrounds.baseHex : theme.text.muted,
            transform: checked ? 'translateX(22px)' : 'translateX(2px)'
          }}
        />
      </button>
      {label && (
        <span style={{ color: theme.text.primary }}>{label}</span>
      )}
    </label>
  );
};