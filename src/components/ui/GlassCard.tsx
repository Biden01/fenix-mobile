import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { NativeGlassCard } from '../../../modules/liquid-glass-tabbar';

interface GlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  cornerRadius?: number;
  tint?: string;
}

export function GlassCard({
  children,
  style,
  cornerRadius = 20,
  tint,
}: GlassCardProps) {
  const theme = useTheme();
  const effectiveTint = tint ?? (theme.isDark ? '#0f0f18' : '#ffffff');

  if (Platform.OS === 'ios' && NativeGlassCard) {
    const NativeView = NativeGlassCard as React.ComponentType<any>;
    return (
      <View style={[{ overflow: 'hidden', borderRadius: cornerRadius }, style]}>
        <NativeView
          cornerRadius={cornerRadius}
          tint={effectiveTint}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  const fallbackBackground = tint
    ? `${effectiveTint}${theme.isDark ? '1F' : '14'}`
    : theme.isDark
    ? 'rgba(15,15,24,0.86)'
    : 'rgba(255,255,255,0.94)';

  // Android / fallback: elevated frosted surface
  return (
    <View style={[{
      backgroundColor: fallbackBackground,
      borderRadius: cornerRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tint ? `${effectiveTint}55` : theme.colors.border,
      overflow: 'hidden',
      shadowColor: theme.isDark ? '#000000' : '#43320A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.isDark ? 0.22 : 0.08,
      shadowRadius: 18,
      elevation: 6,
    }, style]}>
      {children}
    </View>
  );
}
