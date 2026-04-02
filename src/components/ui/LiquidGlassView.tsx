import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
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
  if (Platform.OS !== 'ios' || !NativeLiquidGlassView) {
    return <View style={style}>{children}</View>;
  }

  const NativeView = NativeLiquidGlassView as React.ComponentType<any>;

  return (
    <View style={[style, { overflow: 'hidden' }]}>
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
