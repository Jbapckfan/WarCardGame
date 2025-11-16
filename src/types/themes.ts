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
  // Classic Theme - Original default
  {
    id: 'classic',
    name: 'Classic',
    emoji: '',
    description: 'Timeless card game design',
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
      type: 'pattern',
      value: '#DC2626',
    },
    buttonStyle: {
      borderRadius: 12,
      shadowColor: '#000000',
    },
  },

  // Dark Theme - Pure OLED-friendly
  {
    id: 'dark',
    name: 'Dark',
    emoji: '',
    description: 'Pure dark OLED-friendly',
    colors: {
      primary: '#60A5FA',
      secondary: '#A78BFA',
      accent: '#34D399',
      background: '#000000',
      backgroundGradient: ['#000000', '#0A0A0A', '#141414'],
      cardPile: '#1A1A1A',
      cardBack: '#1E3A8A',
      text: '#FFFFFF',
      textSecondary: '#9CA3AF',
      success: '#34D399',
      error: '#F87171',
      warning: '#FBBF24',
    },
    cardBack: {
      type: 'solid',
      value: '#1E3A8A',
    },
    buttonStyle: {
      borderRadius: 12,
      shadowColor: '#60A5FA',
    },
  },

  // Ocean Theme - Nautical and calming
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '',
    description: 'Smooth sailing ahead',
    colors: {
      primary: '#0EA5E9',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#003049',
      backgroundGradient: ['#003049', '#004E7A', '#006B9E'],
      cardPile: '#00384D',
      cardBack: '#0369A1',
      text: '#FFFFFF',
      textSecondary: '#BAE6FD',
      success: '#06B6D4',
      error: '#DC2626',
      warning: '#F59E0B',
    },
    cardBack: {
      type: 'pattern',
      value: '#0369A1',
    },
    buttonStyle: {
      borderRadius: 16,
      shadowColor: '#0EA5E9',
    },
  },

  // Elegant Theme - Sophisticated cream/gold/navy
  {
    id: 'elegant',
    name: 'Elegant',
    emoji: '',
    description: 'Sophisticated luxury',
    colors: {
      primary: '#D4AF37',
      secondary: '#1E3A8A',
      accent: '#F0E68C',
      background: '#1E293B',
      backgroundGradient: ['#1E293B', '#334155', '#475569'],
      cardPile: '#334155',
      cardBack: '#1E3A8A',
      text: '#F8FAFC',
      textSecondary: '#CBD5E1',
      success: '#D4AF37',
      error: '#DC2626',
      warning: '#F59E0B',
    },
    cardBack: {
      type: 'pattern',
      value: '#1E3A8A',
    },
    buttonStyle: {
      borderRadius: 16,
      shadowColor: '#D4AF37',
    },
  },
];

export const getThemeById = (id: string): Theme => {
  return THEMES.find(theme => theme.id === id) || THEMES[0];
};
