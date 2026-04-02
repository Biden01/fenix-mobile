/**
 * FenixApp Design System - Typography
 * Montserrat for body, Playfair Display for headings
 */

export const fontFamilies = {
  // Body text
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',

  // Display/Headings
  displayRegular: 'PlayfairDisplay_400Regular',
  displayBold: 'PlayfairDisplay_700Bold',
} as const;

export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeights = {
  tight: 1.2,
  snug: 1.3,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.6,
} as const;

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

// Pre-defined text styles
export const textStyles = {
  // Headings (Playfair Display)
  h1: {
    fontFamily: fontFamilies.displayBold,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.snug,
  },
  h2: {
    fontFamily: fontFamilies.displayBold,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.snug,
  },
  h3: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },
  h4: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },

  // Body text (Montserrat)
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.relaxed,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
  },

  // Labels
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },
  labelSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
  },

  // Buttons
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.relaxed,
  },
  buttonSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },

  // Captions
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.relaxed,
  },
} as const;
