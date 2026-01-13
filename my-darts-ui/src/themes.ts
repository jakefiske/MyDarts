// Theme configuration for MyDarts
// Three polished themes, each with a clear purpose

export interface PlayerColor {
  primary: string;
  secondary: string;
  glow: string;
}

export interface Theme {
  name: string;
  playerColors: PlayerColor[];
  backgrounds: {
    base: string; // Main background gradient (Tailwind classes)
    baseHex: string; // Main background color as hex for inline styles
    card: string; // Card backgrounds (Tailwind classes)
    cardHex: string; // Card background color as hex for inline styles
    table: string; // Table row backgrounds
  };
  titleBars: {
    mickeyMouse: string;
    cricket: string;
    x01: string;
  };
  categoryColors: {
    bull: { color: string; glow: string };
    doubles: { color: string; glow: string };
    triples: { color: string; glow: string };
    beds: { color: string; glow: string };
    numbers: { color: string; glow: string };
  };
  stateColors: {
    active: { color: string; glow: string; gradient: string; border: string };
    winner: { gradient: string; border: string };
    bust: { gradient: string; border: string };
    info: { gradient: string; border: string };
    streak: { gradient: string; border: string };
  };
  borders: {
    primary: string;
    secondary: string;
    accent: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  fonts: {
    display: string; // For headers/titles
    score: string; // For scores
    body: string; // For regular text
  };
}

// ============================================
// PRO DARK THEME (Default - Best for extended play)
// ============================================
export const proDarkTheme: Theme = {
  name: 'Pro Dark',
  playerColors: [
    { primary: '#FF1A8C', secondary: '#FF4DB8', glow: 'rgba(255, 26, 140, 0.3)' }, // Hot Pink
    { primary: '#00C2E0', secondary: '#52D5EE', glow: 'rgba(0, 194, 224, 0.3)' }, // Cyan
    { primary: '#FFA000', secondary: '#FFCC4D', glow: 'rgba(255, 160, 0, 0.3)' }, // Gold
    { primary: '#00E676', secondary: '#4DFFAD', glow: 'rgba(0, 230, 118, 0.3)' }, // Neon Green
    { primary: '#9C27B0', secondary: '#BA68C8', glow: 'rgba(156, 39, 176, 0.3)' }, // Purple
    { primary: '#FF4444', secondary: '#FF6B6B', glow: 'rgba(255, 68, 68, 0.3)' }, // Red
  ],
  backgrounds: {
    base: 'from-slate-950 via-slate-900 to-slate-950',
    baseHex: '#0F172A', // slate-950
    card: 'from-slate-900/95 to-slate-950/95',
    cardHex: '#1E293B', // slate-800
    table: 'rgba(15, 23, 42, 0.5)',
  },
  titleBars: {
    mickeyMouse: 'from-red-600/90 to-orange-500/90',
    cricket: 'from-green-600/90 to-emerald-500/90',
    x01: 'from-blue-600/90 to-purple-500/90',
  },
  categoryColors: {
    bull: { color: '#FF1A8C', glow: 'rgba(255, 26, 140, 0.4)' },
    doubles: { color: '#00C2E0', glow: 'rgba(0, 194, 224, 0.4)' },
    triples: { color: '#9C27B0', glow: 'rgba(156, 39, 176, 0.4)' },
    beds: { color: '#FFA000', glow: 'rgba(255, 160, 0, 0.4)' },
    numbers: { color: '#00E676', glow: 'rgba(0, 230, 118, 0.4)' },
  },
  stateColors: {
    active: { 
      color: '#00E676', 
      glow: 'rgba(0, 230, 118, 0.3)',
      gradient: 'from-green-500/90 to-emerald-500/90',
      border: '#00E676'
    },
    winner: { gradient: 'from-yellow-400 to-orange-500', border: '#FFD700' },
    bust: { gradient: 'from-red-600/90 to-red-500/90', border: '#EF4444' },
    info: { gradient: 'from-blue-600/90 to-blue-500/90', border: '#3B82F6' },
    streak: { gradient: 'from-orange-600/90 to-red-600/90', border: '#FB923C' },
  },
  borders: {
    primary: '#334155',
    secondary: '#475569',
    accent: '#64748b',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#E2E8F0', // slate-200
    muted: '#94A3B8', // slate-400
  },
  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    score: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  },
};

// ============================================
// BROADCAST THEME (High Energy - For streaming/tournaments)
// ============================================
export const broadcastTheme: Theme = {
  name: 'Broadcast',
  playerColors: [
    { primary: '#FF0080', secondary: '#FF4DB8', glow: 'rgba(255, 0, 128, 0.5)' }, // Hot Pink
    { primary: '#00D9FF', secondary: '#66E5FF', glow: 'rgba(0, 217, 255, 0.5)' }, // Cyan
    { primary: '#FFB800', secondary: '#FFCC4D', glow: 'rgba(255, 184, 0, 0.5)' }, // Gold
    { primary: '#00FF85', secondary: '#4DFFAD', glow: 'rgba(0, 255, 133, 0.5)' }, // Neon Green
    { primary: '#A855F7', secondary: '#C084FC', glow: 'rgba(168, 85, 247, 0.5)' }, // Purple
    { primary: '#FF3333', secondary: '#FF6666', glow: 'rgba(255, 51, 51, 0.5)' }, // Red
  ],
  backgrounds: {
    base: 'from-black via-purple-950 to-black',
    baseHex: '#0a0014', // Very dark purple
    card: 'from-purple-950/90 to-black/90',
    cardHex: '#1a0033', // Dark purple
    table: 'rgba(0, 0, 0, 0.6)',
  },
  titleBars: {
    mickeyMouse: 'from-pink-500 via-purple-500 to-blue-500',
    cricket: 'from-green-500 via-cyan-500 to-blue-500',
    x01: 'from-yellow-500 via-orange-500 to-red-500',
  },
  categoryColors: {
    bull: { color: '#FF33FF', glow: 'rgba(255, 51, 255, 0.6)' },
    doubles: { color: '#00D9FF', glow: 'rgba(0, 217, 255, 0.6)' },
    triples: { color: '#FFB800', glow: 'rgba(255, 184, 0, 0.6)' }, // Changed from low-contrast yellow
    beds: { color: '#FF8800', glow: 'rgba(255, 136, 0, 0.6)' },
    numbers: { color: '#66FF66', glow: 'rgba(102, 255, 102, 0.6)' },
  },
  stateColors: {
    active: { 
      color: '#00FF85', 
      glow: 'rgba(0, 255, 133, 0.5)',
      gradient: 'from-green-400 to-lime-400',
      border: '#00FF85'
    },
    winner: { gradient: 'from-yellow-400 via-pink-400 to-purple-400', border: '#FF00FF' },
    bust: { gradient: 'from-red-500 to-pink-500', border: '#FF0099' },
    info: { gradient: 'from-cyan-500 to-blue-500', border: '#00FFFF' },
    streak: { gradient: 'from-orange-500 to-yellow-500', border: '#FFFF00' },
  },
  borders: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    accent: '#A78BFA',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#F3E8FF', // Very light purple
    muted: '#C4B5FD', // Brighter muted for dark purple bg
  },
  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    score: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  },
};

// ============================================
// LIGHT THEME (For bright environments/accessibility)
// ============================================
export const lightTheme: Theme = {
  name: 'Light',
  playerColors: [
    { primary: '#DC2626', secondary: '#B91C1C', glow: 'rgba(220, 38, 38, 0.3)' }, // Red
    { primary: '#2563EB', secondary: '#1D4ED8', glow: 'rgba(37, 99, 235, 0.3)' }, // Blue
    { primary: '#059669', secondary: '#047857', glow: 'rgba(5, 150, 105, 0.3)' }, // Green
    { primary: '#D97706', secondary: '#B45309', glow: 'rgba(217, 119, 6, 0.3)' }, // Amber
    { primary: '#7C3AED', secondary: '#6D28D9', glow: 'rgba(124, 58, 237, 0.3)' }, // Purple
    { primary: '#DB2777', secondary: '#BE185D', glow: 'rgba(219, 39, 119, 0.3)' }, // Pink
  ],
  backgrounds: {
    base: 'from-gray-50 to-gray-100',
    baseHex: '#F9FAFB', // gray-50
    card: 'from-white to-gray-50',
    cardHex: '#FFFFFF', // white
    table: 'rgba(255, 255, 255, 0.95)',
  },
  titleBars: {
    mickeyMouse: 'from-gray-800 to-gray-700',
    cricket: 'from-gray-800 to-gray-700',
    x01: 'from-gray-800 to-gray-700',
  },
  categoryColors: {
    bull: { color: '#DC2626', glow: 'rgba(220, 38, 38, 0.3)' },
    doubles: { color: '#2563EB', glow: 'rgba(37, 99, 235, 0.3)' },
    triples: { color: '#7C3AED', glow: 'rgba(124, 58, 237, 0.3)' },
    beds: { color: '#D97706', glow: 'rgba(217, 119, 6, 0.3)' },
    numbers: { color: '#059669', glow: 'rgba(5, 150, 105, 0.3)' },
  },
  stateColors: {
    active: { 
      color: '#059669', 
      glow: 'rgba(5, 150, 105, 0.3)',
      gradient: 'from-green-600 to-green-500',
      border: '#059669'
    },
    winner: { gradient: 'from-yellow-400 to-yellow-500', border: '#F59E0B' },
    bust: { gradient: 'from-red-500 to-red-600', border: '#DC2626' },
    info: { gradient: 'from-blue-500 to-blue-600', border: '#2563EB' },
    streak: { gradient: 'from-purple-500 to-purple-600', border: '#7C3AED' },
  },
  borders: {
    primary: '#E5E7EB', // gray-200
    secondary: '#D1D5DB', // gray-300
    accent: '#9CA3AF', // gray-400
  },
  text: {
    primary: '#111827', // gray-900
    secondary: '#1F2937', // gray-800
    muted: '#6B7280', // gray-500
  },
  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    score: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  },
};

// ============================================
// EXPORT DEFAULT THEME
// ============================================
export const theme = proDarkTheme;

// Export all themes for selection UI
export const themes = {
  proDark: proDarkTheme,
  broadcast: broadcastTheme,
  light: lightTheme,
};