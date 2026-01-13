// Professional Darts Theme System
// Designed for maximum readability from dart throwing distance (8-10 feet)
// Clean, high-contrast, minimal decoration

export interface PlayerColor {
  primary: string;
  secondary: string;
  glow: string;
}

export interface Theme {
  name: string;
  playerColors: PlayerColor[];
  backgrounds: {
    base: string;
    baseHex: string;
    card: string;
    cardHex: string;
    table: string;
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
    display: string;
    score: string;
    body: string;
  };
}

// ============================================
// PROFESSIONAL DARK THEME
// Clean, high-contrast, easy to read
// ============================================
export const professionalDark: Theme = {
  name: 'Professional Dark',
  
  // High-contrast player colors - easily distinguishable
  playerColors: [
    { primary: '#00E5FF', secondary: '#80F2FF', glow: 'rgba(0, 229, 255, 0.4)' },  // Electric Blue
    { primary: '#FF1744', secondary: '#FF5252', glow: 'rgba(255, 23, 68, 0.4)' },   // Red
    { primary: '#76FF03', secondary: '#B2FF59', glow: 'rgba(118, 255, 3, 0.4)' },   // Lime
    { primary: '#FFEA00', secondary: '#FFF59D', glow: 'rgba(255, 234, 0, 0.4)' },   // Yellow
    { primary: '#E040FB', secondary: '#EA80FC', glow: 'rgba(224, 64, 251, 0.4)' },  // Purple
    { primary: '#FF6E40', secondary: '#FF9E80', glow: 'rgba(255, 110, 64, 0.4)' },  // Orange
  ],
  
  backgrounds: {
    base: 'from-slate-950 to-slate-900',
    baseHex: '#0A1628',           // Deep navy, not pure black
    card: 'from-slate-900 to-slate-800',
    cardHex: '#1A2332',           // Elevated card color
    table: 'rgba(26, 35, 50, 0.5)',
  },
  
  titleBars: {
    mickeyMouse: 'from-red-600 to-orange-500',
    cricket: 'from-green-600 to-emerald-500',
    x01: 'from-blue-600 to-purple-500',
  },
  
  categoryColors: {
    bull: { color: '#FF1744', glow: 'rgba(255, 23, 68, 0.4)' },
    doubles: { color: '#00E5FF', glow: 'rgba(0, 229, 255, 0.4)' },
    triples: { color: '#E040FB', glow: 'rgba(224, 64, 251, 0.4)' },
    beds: { color: '#FFEA00', glow: 'rgba(255, 234, 0, 0.4)' },
    numbers: { color: '#76FF03', glow: 'rgba(118, 255, 3, 0.4)' },
  },
  
  stateColors: {
    active: { 
      color: '#00E5FF', 
      glow: 'rgba(0, 229, 255, 0.4)',
      gradient: 'from-cyan-500 to-blue-500',
      border: '#00E5FF'
    },
    winner: { gradient: 'from-yellow-400 to-orange-500', border: '#FFD700' },
    bust: { gradient: 'from-red-600 to-red-500', border: '#FF1744' },
    info: { gradient: 'from-blue-600 to-blue-500', border: '#00E5FF' },
    streak: { gradient: 'from-orange-600 to-red-600', border: '#FF6E40' },
  },
  
  borders: {
    primary: '#2A3342',           // Subtle borders
    secondary: '#1A2332',         // Even more subtle
    accent: '#00E5FF',            // Bright active border
  },
  
  text: {
    primary: '#FFFFFF',           // Pure white for main text
    secondary: '#94A3B8',         // Light gray for secondary
    muted: '#64748B',             // Muted gray
  },
  
  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    score: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
  },
};

// ============================================
// PROFESSIONAL LIGHT THEME
// For bright environments
// ============================================
export const professionalLight: Theme = {
  name: 'Professional Light',
  
  playerColors: [
    { primary: '#0091EA', secondary: '#40C4FF', glow: 'rgba(0, 145, 234, 0.3)' },   // Blue
    { primary: '#D32F2F', secondary: '#EF5350', glow: 'rgba(211, 47, 47, 0.3)' },   // Red
    { primary: '#388E3C', secondary: '#66BB6A', glow: 'rgba(56, 142, 60, 0.3)' },   // Green
    { primary: '#F57C00', secondary: '#FFA726', glow: 'rgba(245, 124, 0, 0.3)' },   // Orange
    { primary: '#7B1FA2', secondary: '#AB47BC', glow: 'rgba(123, 31, 162, 0.3)' },  // Purple
    { primary: '#C2185B', secondary: '#EC407A', glow: 'rgba(194, 24, 91, 0.3)' },   // Pink
  ],
  
  backgrounds: {
    base: 'from-gray-50 to-gray-100',
    baseHex: '#F8FAFC',
    card: 'from-white to-gray-50',
    cardHex: '#FFFFFF',
    table: 'rgba(255, 255, 255, 0.95)',
  },
  
  titleBars: {
    mickeyMouse: 'from-gray-800 to-gray-700',
    cricket: 'from-gray-800 to-gray-700',
    x01: 'from-gray-800 to-gray-700',
  },
  
  categoryColors: {
    bull: { color: '#D32F2F', glow: 'rgba(211, 47, 47, 0.3)' },
    doubles: { color: '#0091EA', glow: 'rgba(0, 145, 234, 0.3)' },
    triples: { color: '#7B1FA2', glow: 'rgba(123, 31, 162, 0.3)' },
    beds: { color: '#F57C00', glow: 'rgba(245, 124, 0, 0.3)' },
    numbers: { color: '#388E3C', glow: 'rgba(56, 142, 60, 0.3)' },
  },
  
  stateColors: {
    active: { 
      color: '#0091EA', 
      glow: 'rgba(0, 145, 234, 0.3)',
      gradient: 'from-blue-600 to-blue-500',
      border: '#0091EA'
    },
    winner: { gradient: 'from-yellow-400 to-yellow-500', border: '#F59E0B' },
    bust: { gradient: 'from-red-500 to-red-600', border: '#D32F2F' },
    info: { gradient: 'from-blue-500 to-blue-600', border: '#0091EA' },
    streak: { gradient: 'from-purple-500 to-purple-600', border: '#7B1FA2' },
  },
  
  borders: {
    primary: '#E2E8F0',
    secondary: '#F1F5F9',
    accent: '#0091EA',
  },
  
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  
  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    score: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
  },
};

// ============================================
// EXPORT
// ============================================
export const theme = professionalDark;

export const themes = {
  professionalDark,
  professionalLight,
};