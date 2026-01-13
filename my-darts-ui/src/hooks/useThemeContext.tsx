import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { themes, Theme } from '../themes';

type ThemeName = 'proDark' | 'broadcast' | 'light';

interface ThemeContextType {
  themeName: ThemeName;
  theme: Theme;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeName>('proDark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('dartsTheme') as ThemeName;
    // Migration: map old theme names to new ones
    const themeMapping: Record<string, ThemeName> = {
      'broadcast': 'proDark', // Old broadcast becomes Pro Dark
      'classicPub': 'proDark', // Classic Pub becomes Pro Dark
      'neonNights': 'broadcast', // Neon Nights becomes Broadcast
      'minimal': 'light', // Minimal becomes Light
    };
    
    if (savedTheme) {
      const mappedTheme = themeMapping[savedTheme] || savedTheme;
      if (themes[mappedTheme as ThemeName]) {
        setThemeName(mappedTheme as ThemeName);
      }
    }
  }, []);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem('dartsTheme', name);
  };

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider value={{ themeName, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};