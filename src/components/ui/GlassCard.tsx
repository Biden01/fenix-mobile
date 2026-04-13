import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
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
  tint = '#ffffff',
}: GlassCardProps) {
  if (Platform.OS === 'ios' && NativeGlassCard) {
    const NativeView = NativeGlassCard as React.ComponentType<any>;
    return (
      <View style={[{ overflow: 'hidden', borderRadius: cornerRadius }, style]}>
        <NativeView
          cornerRadius={cornerRadius}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  return <View style={style}>{children}</View>;
}
