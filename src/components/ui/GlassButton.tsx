import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
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
  tint,
  onPress,
  style,
}: GlassButtonProps) {
  const theme = useTheme();
  const activeTint = tint ?? theme.gold.primary;

  if (Platform.OS === 'ios' && NativeGlassButton) {
    const NativeView = NativeGlassButton as React.ComponentType<any>;
    return (
      <View style={style}>
        <NativeView
          label={label}
          icon={icon ?? ''}
          tint={activeTint}
          onButtonPress={() => onPress()}
          style={styles.nativeButton}
        />
      </View>
    );
  }

  // Android / fallback
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 48,
        backgroundColor: activeTint + '1A',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: activeTint + '3D',
        shadowColor: theme.isDark ? '#000000' : '#5E4708',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: theme.isDark ? 0.16 : 0.07,
        shadowRadius: 14,
        elevation: 4,
      }, style]}
    >
      <Text style={{ color: activeTint, fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nativeButton: {
    height: 48,
  },
});
