/**
 * ZharqynApp Design System - Layout Constants
 * Spacing, border radius, shadows, and common dimensions
 */
import { Platform } from 'react-native';

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// On Android elevation creates shadows on ALL 4 sides equally (not directional like iOS).
// Use lower values to avoid prominent side shadows.
const isAndroid = Platform.OS === 'android';

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: isAndroid ? 1 : 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: isAndroid ? 2 : 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: isAndroid ? 3 : 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: isAndroid ? 4 : 12,
  },
  // Gold glow (iOS only effect — shadowColor with no offset creates a halo).
  // On Android, use minimal elevation to avoid black side shadows.
  gold: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: isAndroid ? 2 : 10,
  },
};

// Common component dimensions
export const dimensions = {
  // Tab bar
  tabBarHeight: 80,
  tabBarPaddingBottom: 20,

  // Icons
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  iconXLarge: 32,

  // Buttons
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,

  // Inputs
  inputHeight: 48,
  inputHeightSmall: 40,

  // Cards
  cardPadding: spacing[4],
  cardBorderWidth: 1,

  // Avatar
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 64,
  avatarXLarge: 96,

  // Progress
  progressHeight: 8,
  progressHeightSmall: 4,

  // Badge
  badgeHeight: 24,
  badgeHeightSmall: 20,
} as const;

// Screen padding
export const screenPadding = {
  horizontal: spacing[4],
  vertical: spacing[4],
  top: spacing[4],
  bottom: spacing[6],
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  tooltip: 1400,
  toast: 1500,
} as const;
