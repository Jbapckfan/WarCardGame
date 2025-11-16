/**
 * Design System - Professional iOS Game Standards
 * Consistent spacing, typography, shadows, and styling throughout the app
 */

import { ViewStyle, TextStyle } from 'react-native';

export const DesignSystem = {
  /**
   * Spacing Scale (8pt grid system)
   * Use these for padding, margins, gaps
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /**
   * Border Radius
   * Consistent rounding for cards, buttons, modals
   */
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    round: 999, // Fully rounded (pills)
  },

  /**
   * Typography Scale
   * Font sizes for consistent text hierarchy
   */
  typography: {
    display: 48,      // Main title
    title: 32,        // Section titles
    heading: 24,      // Card/modal titles
    subheading: 20,   // Subtitles
    body: 16,         // Regular text
    caption: 14,      // Small text
    tiny: 12,         // Metadata/helper text
  },

  /**
   * Font Weights
   * Consistent weight scale
   */
  fontWeights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extraBold: '900' as TextStyle['fontWeight'],
  },

  /**
   * Shadow Depths
   * Elevation levels for layering
   */
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    strong: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 16,
    },
    floating: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 24,
    },
  },

  /**
   * Animation Timings
   * Consistent durations and easings
   */
  animation: {
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 500,
    },
    spring: {
      gentle: { damping: 20, stiffness: 120 },
      bouncy: { damping: 12, stiffness: 150 },
      snappy: { damping: 15, stiffness: 200 },
    },
  },

  /**
   * Common Button Styles
   * Reusable button configurations
   */
  buttons: {
    primary: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
    } as ViewStyle,
    secondary: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
    } as ViewStyle,
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    } as ViewStyle,
  },

  /**
   * Card Dimensions
   * Standard card sizes
   */
  cards: {
    standard: {
      width: 80,
      height: 120,
      borderRadius: 12,
    },
    large: {
      width: 100,
      height: 150,
      borderRadius: 16,
    },
    small: {
      width: 60,
      height: 90,
      borderRadius: 8,
    },
  },

  /**
   * Z-Index Layers
   * Stacking order for overlays
   */
  zIndex: {
    background: -1,
    default: 0,
    elevated: 10,
    modal: 100,
    overlay: 1000,
    tooltip: 2000,
  },

  /**
   * Common Text Styles
   * Ready-to-use text configurations
   */
  textStyles: {
    displayTitle: {
      fontSize: 48,
      fontWeight: '700' as TextStyle['fontWeight'],
      letterSpacing: -1,
    } as TextStyle,
    title: {
      fontSize: 32,
      fontWeight: '700' as TextStyle['fontWeight'],
      letterSpacing: -0.5,
    } as TextStyle,
    heading: {
      fontSize: 24,
      fontWeight: '600' as TextStyle['fontWeight'],
    } as TextStyle,
    subheading: {
      fontSize: 20,
      fontWeight: '600' as TextStyle['fontWeight'],
    } as TextStyle,
    body: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
    } as TextStyle,
    caption: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
    } as TextStyle,
    tiny: {
      fontSize: 12,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 16,
    } as TextStyle,
  },

  /**
   * Layout Constants
   * Screen padding and safe areas
   */
  layout: {
    screenPadding: 20,
    cardMargin: 16,
    sectionSpacing: 24,
    headerHeight: 60,
  },
};

/**
 * Helper function to create consistent card styles
 */
export const createCardStyle = (variant: 'standard' | 'large' | 'small' = 'standard'): ViewStyle => ({
  ...DesignSystem.cards[variant],
  ...DesignSystem.shadows.medium,
  backgroundColor: '#FFFFFF',
  overflow: 'hidden',
});

/**
 * Helper function to create consistent button styles
 */
export const createButtonStyle = (
  type: 'primary' | 'secondary' | 'small' = 'primary',
  shadow: 'none' | 'subtle' | 'medium' | 'strong' = 'medium'
): ViewStyle => ({
  ...DesignSystem.buttons[type],
  ...DesignSystem.shadows[shadow],
});
