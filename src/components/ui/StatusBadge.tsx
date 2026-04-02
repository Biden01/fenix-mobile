import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'gold' | 'muted';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function StatusBadge({
  label,
  variant = 'muted',
  size = 'md',
  style,
}: StatusBadgeProps) {
  const theme = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: `${theme.semantic.success}20`,
          text: theme.semantic.success,
        };
      case 'warning':
        return {
          bg: `${theme.semantic.warning}20`,
          text: theme.semantic.warning,
        };
      case 'error':
        return {
          bg: `${theme.semantic.error}20`,
          text: theme.semantic.error,
        };
      case 'info':
        return {
          bg: `${theme.semantic.info}20`,
          text: theme.semantic.info,
        };
      case 'gold':
        return {
          bg: theme.colors.goldSurface,
          text: theme.colors.goldForeground,
        };
      default:
        return {
          bg: theme.colors.muted,
          text: theme.colors.mutedForeground,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: size === 'sm' ? theme.spacing[2] : theme.spacing[3],
          paddingVertical: size === 'sm' ? 2 : theme.spacing[1],
          borderRadius: theme.borderRadius.full,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            fontFamily: theme.fonts.medium,
            fontSize: size === 'sm' ? theme.fontSizes.xs : theme.fontSizes.sm,
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
});
