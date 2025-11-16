// Visual Theme System
// Allows users to customize the look and feel of all games

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  description: string;

  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundGradient: string[];
    cardPile: string;
    cardBack: string;
    text: string;
    textSecondary: string;
    success: string;
    error: string;
    warning: string;
  };

  // Card styling
  cardBack: {
    type: 'solid' | 'pattern' | 'image';
    value: string; // Color for solid, pattern name, or image emoji
    emoji?: string; // Optional emoji overlay (like Bill Cipher)
  };

  // UI Elements
  buttonStyle: {
    borderRadius: number;
    shadowColor: string;
  };
}

export const THEMES: Theme[] = [
  // Default Theme
  {
    id: 'default',
    name: 'Classic',
    emoji: '🎴',
    description: 'Original card game look',
    colors: {
      primary: '#F59E0B',
      secondary: '#7C3AED',
      accent: '#10B981',
      background: '#0F172A',
      backgroundGradient: ['#0F172A', '#1E293B', '#334155'],
      cardPile: '#1F2937',
      cardBack: '#DC2626',
      text: '#FFFFFF',
      textSecondary: '#94A3B8',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
    },
    cardBack: {
      type: 'solid',
      value: '#DC2626',
    },
    buttonStyle: {
      borderRadius: 12,
      shadowColor: '#000000',
    },
  },

  // Roblox Theme
  {
    id: 'roblox',
    name: 'Roblox',
    emoji: '🟥',
    description: 'Blocky and bold!',
    colors: {
      primary: '#E31837',
      secondary: '#00A2FF',
      accent: '#FFD700',
      background: '#232323',
      backgroundGradient: ['#232323', '#2D2D2D', '#383838'],
      cardPile: '#404040',
      cardBack: '#E31837',
      text: '#FFFFFF',
      textSecondary: '#A0A0A0',
      success: '#00D26A',
      error: '#E31837',
      warning: '#FFB800',
    },
    cardBack: {
      type: 'pattern',
      value: '#E31837',
      emoji: '🟥',
    },
    buttonStyle: {
      borderRadius: 4,
      shadowColor: '#E31837',
    },
  },

  // Minecraft Theme
  {
    id: 'minecraft',
    name: 'Minecraft',
    emoji: '⛏️',
    description: 'Pixelated adventure',
    colors: {
      primary: '#8B4513',
      secondary: '#228B22',
      accent: '#4169E1',
      background: '#87CEEB',
      backgroundGradient: ['#87CEEB', '#6BA3D0', '#4F78A5'],
      cardPile: '#654321',
      cardBack: '#228B22',
      text: '#FFFFFF',
      textSecondary: '#D4D4D4',
      success: '#228B22',
      error: '#DC143C',
      warning: '#FFD700',
    },
    cardBack: {
      type: 'pattern',
      value: '#228B22',
      emoji: '🟩',
    },
    buttonStyle: {
      borderRadius: 0,
      shadowColor: '#000000',
    },
  },

  // Gravity Falls Theme
  {
    id: 'gravity_falls',
    name: 'Gravity Falls',
    emoji: '🔺',
    description: 'Mysterious and strange',
    colors: {
      primary: '#FFD700',
      secondary: '#4B0082',
      accent: '#00CED1',
      background: '#1a0033',
      backgroundGradient: ['#1a0033', '#2d1b4e', '#403569'],
      cardPile: '#2d1b4e',
      cardBack: '#000000',
      text: '#FFD700',
      textSecondary: '#B8860B',
      success: '#00CED1',
      error: '#FF4500',
      warning: '#FFD700',
    },
    cardBack: {
      type: 'image',
      value: '#000000',
      emoji: '👁️', // Bill Cipher's eye
    },
    buttonStyle: {
      borderRadius: 8,
      shadowColor: '#FFD700',
    },
  },

  // James Bond Theme
  {
    id: 'james_bond',
    name: 'James Bond',
    emoji: '🕴️',
    description: 'Shaken, not stirred',
    colors: {
      primary: '#C9B037',
      secondary: '#000000',
      accent: '#FFFFFF',
      background: '#0a0a0a',
      backgroundGradient: ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
      cardPile: '#1a1a1a',
      cardBack: '#000000',
      text: '#C9B037',
      textSecondary: '#808080',
      success: '#C9B037',
      error: '#8B0000',
      warning: '#C9B037',
    },
    cardBack: {
      type: 'image',
      value: '#000000',
      emoji: '🔫',
    },
    buttonStyle: {
      borderRadius: 20,
      shadowColor: '#C9B037',
    },
  },

  // Green Bay Packers Theme
  {
    id: 'packers',
    name: 'Green Bay Packers',
    emoji: '🏈',
    description: 'Go Pack Go!',
    colors: {
      primary: '#FFB612',
      secondary: '#203731',
      accent: '#FFB612',
      background: '#203731',
      backgroundGradient: ['#203731', '#2d4a42', '#3a5d53'],
      cardPile: '#1a2b26',
      cardBack: '#203731',
      text: '#FFB612',
      textSecondary: '#B8860B',
      success: '#FFB612',
      error: '#8B0000',
      warning: '#FFB612',
    },
    cardBack: {
      type: 'image',
      value: '#203731',
      emoji: 'G', // Packers G logo (using letter)
    },
    buttonStyle: {
      borderRadius: 16,
      shadowColor: '#FFB612',
    },
  },

  // Star Wars Theme
  {
    id: 'star_wars',
    name: 'Star Wars',
    emoji: '⚔️',
    description: 'May the Force be with you',
    colors: {
      primary: '#FFE81F',
      secondary: '#000000',
      accent: '#00D4FF',
      background: '#000000',
      backgroundGradient: ['#000000', '#0a0a1a', '#14142a'],
      cardPile: '#1a1a2e',
      cardBack: '#000000',
      text: '#FFE81F',
      textSecondary: '#808080',
      success: '#00FF00',
      error: '#FF0000',
      warning: '#FFE81F',
    },
    cardBack: {
      type: 'image',
      value: '#000000',
      emoji: '⭐',
    },
    buttonStyle: {
      borderRadius: 12,
      shadowColor: '#FFE81F',
    },
  },

  // Christmas Theme
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    description: 'Ho ho ho!',
    colors: {
      primary: '#DC143C',
      secondary: '#228B22',
      accent: '#FFD700',
      background: '#0d3d0d',
      backgroundGradient: ['#0d3d0d', '#1a5c1a', '#267b26'],
      cardPile: '#8B0000',
      cardBack: '#DC143C',
      text: '#FFFFFF',
      textSecondary: '#F0E68C',
      success: '#228B22',
      error: '#DC143C',
      warning: '#FFD700',
    },
    cardBack: {
      type: 'image',
      value: '#DC143C',
      emoji: '🎅',
    },
    buttonStyle: {
      borderRadius: 16,
      shadowColor: '#DC143C',
    },
  },

  // Indiana Jones / Adventure Theme
  {
    id: 'indiana_jones',
    name: 'Adventure',
    emoji: '🗿',
    description: 'Fortune and glory, kid',
    colors: {
      primary: '#D4AF37',
      secondary: '#8B4513',
      accent: '#CD853F',
      background: '#3E2723',
      backgroundGradient: ['#3E2723', '#5D4037', '#6D4C41'],
      cardPile: '#4E342E',
      cardBack: '#8B4513',
      text: '#D4AF37',
      textSecondary: '#BDB76B',
      success: '#D4AF37',
      error: '#8B0000',
      warning: '#FFD700',
    },
    cardBack: {
      type: 'image',
      value: '#8B4513',
      emoji: '🗿', // Ancient temple stone
    },
    buttonStyle: {
      borderRadius: 8,
      shadowColor: '#8B4513',
    },
  },

  // Ocean / Nautical Theme
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '⚓',
    description: 'Smooth sailing ahead',
    colors: {
      primary: '#00CED1',
      secondary: '#1E90FF',
      accent: '#FFD700',
      background: '#003049',
      backgroundGradient: ['#003049', '#004E7A', '#006B9E'],
      cardPile: '#00384D',
      cardBack: '#1E90FF',
      text: '#FFFFFF',
      textSecondary: '#87CEEB',
      success: '#00CED1',
      error: '#DC143C',
      warning: '#FFD700',
    },
    cardBack: {
      type: 'image',
      value: '#1E90FF',
      emoji: '⚓',
    },
    buttonStyle: {
      borderRadius: 20,
      shadowColor: '#00CED1',
    },
  },

  // Casino / Vegas Theme
  {
    id: 'vegas',
    name: 'Vegas',
    emoji: '🎰',
    description: 'What happens in Vegas...',
    colors: {
      primary: '#FF1744',
      secondary: '#FFD700',
      accent: '#FFFFFF',
      background: '#1A0000',
      backgroundGradient: ['#1A0000', '#2D0000', '#400000'],
      cardPile: '#2D0000',
      cardBack: '#8B0000',
      text: '#FFD700',
      textSecondary: '#FFA500',
      success: '#00FF00',
      error: '#FF1744',
      warning: '#FFD700',
    },
    cardBack: {
      type: 'image',
      value: '#8B0000',
      emoji: '💎',
    },
    buttonStyle: {
      borderRadius: 24,
      shadowColor: '#FFD700',
    },
  },

  // Neon / Cyberpunk Theme
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '🌃',
    description: 'Welcome to the future',
    colors: {
      primary: '#FF006E',
      secondary: '#00F5FF',
      accent: '#FFBE0B',
      background: '#0A0A0A',
      backgroundGradient: ['#0A0A0A', '#1A0F2E', '#2A1A4E'],
      cardPile: '#1A0F2E',
      cardBack: '#000000',
      text: '#00F5FF',
      textSecondary: '#FF006E',
      success: '#00FF41',
      error: '#FF006E',
      warning: '#FFBE0B',
    },
    cardBack: {
      type: 'image',
      value: '#000000',
      emoji: '⚡',
    },
    buttonStyle: {
      borderRadius: 4,
      shadowColor: '#00F5FF',
    },
  },
];

export const getThemeById = (id: string): Theme => {
  return THEMES.find(theme => theme.id === id) || THEMES[0];
};
