import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { NativeLiquidGlassView } from '../../../modules/liquid-glass-tabbar';

interface LiquidGlassViewProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  cornerRadius?: number;
  tint?: string;
  interactive?: boolean;
}

export function LiquidGlassView({
  children,
  style,
  cornerRadius = 16,
  tint = '#ffffff',
  interactive = false,
}: LiquidGlassViewProps) {
  const theme = useTheme();

  if (Platform.OS === 'ios' && NativeLiquidGlassView) {
    const NativeView = NativeLiquidGlassView as React.ComponentType<any>;
    return (
      <View style={[{ overflow: 'hidden' }, style]}>
        <NativeView
          cornerRadius={cornerRadius}
          tint={tint}
          interactive={interactive}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          overflow: 'hidden',
          borderRadius: cornerRadius,
          backgroundColor: theme.isDark ? 'rgba(15,15,24,0.84)' : 'rgba(255,255,255,0.9)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
        },
        style,
      ]}
      pointerEvents={interactive ? 'auto' : 'box-none'}
    >
      {children}
    </View>
  );
}
