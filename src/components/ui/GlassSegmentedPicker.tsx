import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { NativeGlassSegmentedPicker, PickerItemData } from '../../../modules/liquid-glass-tabbar';

interface GlassSegmentedPickerProps {
  items: PickerItemData[];
  selectedId: string;
  onSelect: (id: string) => void;
  tint?: string;
  style?: ViewStyle;
}

export function GlassSegmentedPicker({
  items,
  selectedId,
  onSelect,
  tint = '#FFD700',
  style,
}: GlassSegmentedPickerProps) {
  if (Platform.OS === 'ios' && NativeGlassSegmentedPicker) {
    const NativeView = NativeGlassSegmentedPicker as React.ComponentType<any>;
    return (
      <View style={style}>
        <NativeView
          items={items}
          selectedId={selectedId}
          tint={tint}
          onSelect={(e: { nativeEvent: { id: string } }) => onSelect(e.nativeEvent.id)}
          style={styles.nativePicker}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  nativePicker: {
    height: 44,
  },
});
