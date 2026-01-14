import React from 'react';
import { useTheme } from '../../hooks/useThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full h-full max-w-7xl max-h-screen m-4 rounded-lg overflow-hidden"
        style={{ background: theme.backgrounds.baseHex }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ 
            background: theme.backgrounds.cardHex,
            borderColor: theme.borders.secondary 
          }}
        >
          <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-4xl font-bold px-4 py-2 rounded-lg hover:opacity-80"
            style={{ 
              color: theme.text.primary,
              background: theme.backgrounds.baseHex
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="h-full pb-20">
          {children}
        </div>
      </div>
    </div>
  );
};