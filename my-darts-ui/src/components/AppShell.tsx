import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useThemeContext';

export type View = 'home' | 'game' | 'settings' | 'stats';

interface NavItem {
  id: View;
  label: string;
  icon: string;
}

interface AppShellProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isInGame: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ 
  currentView, 
  onNavigate, 
  isInGame,
  children 
}) => {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Auto-collapse sidebar when in game
  useEffect(() => {
    if (isInGame) {
      setSidebarCollapsed(true);
    }
  }, [isInGame]);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Play', icon: '🎯' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // When in game, allow full hide
  const toggleSidebar = () => {
    if (isInGame) {
      if (sidebarHidden) {
        setSidebarHidden(false);
        setSidebarCollapsed(true);
      } else if (sidebarCollapsed) {
        setSidebarHidden(true);
      } else {
        setSidebarCollapsed(true);
      }
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const sidebarWidth = sidebarHidden ? 0 : sidebarCollapsed ? 64 : 200;

  return (
    <div className="fixed inset-0 flex" style={{ backgroundColor: theme.backgrounds.baseHex }}>
      {/* ===== SIDEBAR ===== */}
      <div 
        className="flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden"
        style={{ 
          width: sidebarWidth,
          borderRight: sidebarHidden ? 'none' : `1px solid ${theme.borders.secondary}`,
          background: theme.backgrounds.cardHex 
        }}
      >
        {/* Logo/Brand */}
        <div 
          className="flex-shrink-0 flex items-center gap-3 p-4 cursor-pointer"
          onClick={toggleSidebar}
          style={{ borderBottom: `1px solid ${theme.borders.secondary}` }}
        >
          <span className="text-2xl">🎯</span>
          {!sidebarCollapsed && (
            <span 
              className="font-bold text-lg whitespace-nowrap"
              style={{ color: theme.text.primary, fontFamily: theme.fonts.display }}
            >
              MyDarts
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map(item => {
            const isActive = currentView === item.id || (item.id === 'home' && currentView === 'game');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all"
                style={{
                  background: isActive ? `${theme.stateColors.active.color}22` : 'transparent',
                  borderLeft: isActive ? `3px solid ${theme.stateColors.active.color}` : '3px solid transparent',
                  color: isActive ? theme.stateColors.active.color : theme.text.secondary,
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle (bottom) */}
        <div 
          className="flex-shrink-0 p-4 border-t"
          style={{ borderColor: theme.borders.secondary }}
        >
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 py-2 rounded transition-all"
            style={{ 
              background: theme.backgrounds.baseHex,
              color: theme.text.muted 
            }}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            <span className="text-sm">
              {sidebarCollapsed ? '→' : '←'}
            </span>
            {!sidebarCollapsed && (
              <span className="text-xs">Collapse</span>
            )}
          </button>
        </div>
      </div>

      {/* ===== SHOW SIDEBAR BUTTON (when hidden in game) ===== */}
      {sidebarHidden && (
        <button
          onClick={() => setSidebarHidden(false)}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          style={{ 
            background: theme.backgrounds.cardHex,
            color: theme.text.primary,
            border: `1px solid ${theme.borders.secondary}`
          }}
        >
          ☰
        </button>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default AppShell;