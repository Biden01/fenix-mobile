/**
 * FenixApp Design System - Theme Export
 */

import { createContext, useContext } from 'react';
import {
  gold,
  semantic,
  darkTheme,
  lightTheme,
  chartColors,
  gradients,
  type ThemeColors,
  type ColorScheme,
} from './colors';
import { fontFamilies, fontSizes, lineHeights, fontWeights, textStyles } from './typography';
import { spacing, borderRadius, shadows, dimensions, screenPadding, zIndex } from './layout';

export interface Theme {
  colors: ThemeColors;
  gold: typeof gold;
  semantic: typeof semantic;
  chartColors: typeof chartColors;
  gradients: typeof gradients;
  fonts: typeof fontFamilies;
  fontSizes: typeof fontSizes;
  lineHeights: typeof lineHeights;
  fontWeights: typeof fontWeights;
  textStyles: typeof textStyles;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  dimensions: typeof dimensions;
  screenPadding: typeof screenPadding;
  zIndex: typeof zIndex;
  isDark: boolean;
}

export const createTheme = (colorScheme: ColorScheme): Theme => ({
  colors: (colorScheme === 'dark' ? darkTheme : lightTheme) as ThemeColors,
  gold,
  semantic,
  chartColors,
  gradients,
  fonts: fontFamilies,
  fontSizes,
  lineHeights,
  fontWeights,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  dimensions,
  screenPadding,
  zIndex,
  isDark: colorScheme === 'dark',
});

// Theme context
const ThemeContext = createContext<Theme | undefined>(undefined);

export const ThemeProvider = ThemeContext.Provider;

export const useTheme = (): Theme => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};

// Re-export everything
export * from './colors';
export * from './typography';
export * from './layout';
