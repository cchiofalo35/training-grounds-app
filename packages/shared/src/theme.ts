/**
 * Training Grounds Brand Theme
 * Matches the official website: cchiofalo35.github.io/training-grounds-website
 *
 * Usage:
 *   import { colors, fonts, spacing, borderRadius } from '@shared/theme';
 */

export const colors = {
  // Core palette
  charcoal: '#1E1E1E',
  darkGrey: '#2A2A2A',
  warmAccent: '#C9A87C',  // Gold — primary accent
  steel: '#B0B5B8',
  offWhite: '#FAFAF8',
  softWhite: '#F7F5F2',
  lightGrey: '#F2F2F0',

  // Text
  textDark: '#1A1A1A',
  textBody: '#4A4A4A',
  textMuted: '#7A7A7A',
  textLight: 'rgba(255, 255, 255, 0.65)',

  // Semantic
  success: '#38A169',
  error: '#E53E3E',
  warning: '#D69E2E',
  info: '#4A90E2',

  // Belt colors
  belt: {
    white: '#FFFFFF',
    blue: '#4A90E2',
    purple: '#8B5CF6',
    brown: '#A0522D',
    black: '#1A1A1A',
  },

  // UI surfaces
  cardDark: '#2A2A2A',
  cardLight: '#FFFFFF',
  borderDark: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(0, 0, 0, 0.05)',
  navBg: 'rgba(30, 30, 30, 0.97)',

  // Heatmap intensity
  heatmap: {
    empty: '#2A2A2A',
    light: '#3E5C76',
    medium: '#7A8E8A',
    hot: '#C9A87C',
  },

  // League colors
  league: {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#C9A87C',
    platinum: '#E5E4E2',
    diamond: '#00D4FF',
    blackBelt: '#1A1A1A',
  },
} as const;

export const fonts = {
  heading: "'Bebas Neue', sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

  weight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    hero: 80,   // Bebas Neue hero text
  },

  letterSpacing: {
    tight: -0.01,
    normal: 0,
    wide: 0.02,     // Headings
    wider: 0.06,    // Buttons, labels
    widest: 0.25,   // Uppercase small labels
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 60,
} as const;

export const borderRadius = {
  sm: 4,
  md: 6,      // Buttons
  lg: 8,
  xl: 14,     // Cards
  full: 9999, // Pills, avatars
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 50,
    elevation: 8,
  },
} as const;

export const buttonStyles = {
  primary: {
    backgroundColor: colors.warmAccent,
    color: colors.charcoal,
    paddingVertical: 15,
    paddingHorizontal: 38,
    borderRadius: borderRadius.md,
    fontWeight: fonts.weight.bold,
    fontSize: fonts.size.sm,
    letterSpacing: fonts.letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    fontWeight: fonts.weight.bold,
    fontSize: fonts.size.sm,
    letterSpacing: fonts.letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
} as const;
