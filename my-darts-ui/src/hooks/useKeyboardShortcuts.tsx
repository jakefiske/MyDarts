import { useEffect } from 'react';

interface ShortcutHandlers {
  onUndo?: () => void;
  onConfirm?: () => void;
  onQuit?: () => void;
  onMenu?: () => void;
  onTvMode?: () => void;
}

/**
 * Hook for keyboard shortcuts
 * Provides desktop power-user shortcuts for common actions
 */
export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && handlers.onUndo) {
        e.preventDefault();
        handlers.onUndo();
      }
      
      // Confirm: Enter
      if (e.key === 'Enter' && handlers.onConfirm) {
        e.preventDefault();
        handlers.onConfirm();
      }
      
      // Quit/Back: Escape
      if (e.key === 'Escape' && handlers.onQuit) {
        e.preventDefault();
        handlers.onQuit();
      }
      
      // Toggle Menu: M
      if (e.key === 'm' && handlers.onMenu) {
        e.preventDefault();
        handlers.onMenu();
      }
      
      // Toggle TV Mode: T
      if (e.key === 't' && handlers.onTvMode) {
        e.preventDefault();
        handlers.onTvMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlers]);
};