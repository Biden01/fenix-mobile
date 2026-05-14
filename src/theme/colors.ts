/**
 * ZharqynApp Design System - Colors
 * Premium Gold Theme with Dark/Light mode support
 */

// Gold Palette
export const gold = {
  primary: '#FFD700',
  dark: '#DAA520',
  darker: '#B8860B',
  light: 'rgba(255, 215, 0, 0.1)',
  lightSolid: '#FFF8DC',
} as const;

// Semantic Colors
export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  error: '#DC2626',
  destructive: '#EF4444',
} as const;

// Dark Theme
export const darkTheme = {
  background: '#0A0A0A',
  foreground: 'rgba(255, 255, 255, 0.95)',
  card: '#0F0F18',
  cardForeground: 'rgba(255, 255, 255, 0.95)',
  popover: '#1A1A2E',
  popoverForeground: 'rgba(255, 255, 255, 0.95)',
  primary: gold.primary,
  primaryForeground: '#0A0A0A',
  secondary: '#1A1A2E',
  secondaryForeground: 'rgba(255, 255, 255, 0.7)',
  muted: '#1A1A2E',
  mutedForeground: 'rgba(255, 255, 255, 0.5)',
  accent: gold.dark,
  accentForeground: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.1)',
  input: 'rgba(255, 255, 255, 0.05)',
  inputBackground: '#1A1A2E',
  ring: gold.primary,
  // Theme-aware gold for text/icons: bright on dark, deep amber on light
  goldForeground: '#FFD700',
  goldSurface: 'rgba(255, 215, 0, 0.12)',
} as const;

// Light Theme
export const lightTheme = {
  background: '#F4F2EB',        // Тёплый кремово-золотистый фон
  foreground: '#111827',
  card: '#FFFFFF',
  cardForeground: '#111827',
  popover: '#FFFFFF',
  popoverForeground: '#111827',
  primary: gold.dark,
  primaryForeground: '#FFFFFF',
  secondary: '#EDE9DC',         // Тёплый бежевый
  secondaryForeground: '#111827',
  muted: '#EDE9DC',
  mutedForeground: '#6B7280',
  accent: gold.primary,
  accentForeground: '#111827',
  border: 'rgba(0, 0, 0, 0.08)',
  input: 'transparent',
  inputBackground: '#E8E4D6',   // Тёплый инпут
  ring: gold.dark,
  // Theme-aware gold: deep amber (#9A7000 = 4.4:1 on white) for legibility
  goldForeground: '#9A7000',
  goldSurface: 'rgba(154, 112, 0, 0.1)',
} as const;

// Chart Colors
export const chartColors = {
  chart1: gold.primary,
  chart2: semantic.success,
  chart3: semantic.info,
  chart4: semantic.warning,
  chart5: semantic.error,
} as const;

// Gradient definitions for use with expo-linear-gradient
export const gradients = {
  goldPrimary: [gold.primary, gold.dark] as const,
  goldDark: [gold.dark, gold.darker] as const,
  darkCard: ['#0F0F18', '#1A1A2E'] as const,
  goldGlow: ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0)'] as const,
} as const;

export type ThemeColors = typeof darkTheme;
export type ColorScheme = 'dark' | 'light';
