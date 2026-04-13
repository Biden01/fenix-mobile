import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { NativeGlassButton } from '../../../modules/liquid-glass-tabbar';

interface GlassButtonProps {
  label: string;
  icon?: string;
  tint?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function GlassButton({
  label,
  icon,
  tint = '#FFD700',
  onPress,
  style,
}: GlassButtonProps) {
  if (Platform.OS === 'ios' && NativeGlassButton) {
    const NativeView = NativeGlassButton as React.ComponentType<any>;
    return (
      <View style={style}>
        <NativeView
          label={label}
          icon={icon ?? ''}
          tint={tint}
          onButtonPress={() => onPress()}
          style={styles.nativeButton}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  nativeButton: {
    height: 48,
  },
});
