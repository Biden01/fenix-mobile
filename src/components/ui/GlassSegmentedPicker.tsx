import React from 'react';
import { Platform, StyleSheet, ScrollView, TouchableOpacity, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
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
  tint,
  style,
}: GlassSegmentedPickerProps) {
  const theme = useTheme();
  const activeTint = tint ?? theme.gold.primary;

  if (Platform.OS === 'ios' && NativeGlassSegmentedPicker) {
    const NativeView = NativeGlassSegmentedPicker as React.ComponentType<any>;
    return (
      <View style={style}>
        <NativeView
          items={items}
          selectedId={selectedId}
          tint={activeTint}
          onSelect={(e: { nativeEvent: { id: string } }) => onSelect(e.nativeEvent.id)}
          style={styles.nativePicker}
        />
      </View>
    );
  }

  // Android / fallback: horizontal scrollable tabs
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[
        {
          flexGrow: 0,
          backgroundColor: theme.colors.muted,
          borderRadius: 24,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
        },
        style,
      ]}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 6, paddingVertical: 6 }}
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.7}
            style={{
              minHeight: 40,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isSelected ? activeTint + '20' : 'transparent',
              borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
              borderColor: isSelected ? activeTint : theme.colors.border,
            }}
          >
            <Text style={{
              fontFamily: isSelected ? theme.fonts.semibold : theme.fonts.regular,
              fontSize: theme.fontSizes.sm,
              color: isSelected ? activeTint : theme.colors.mutedForeground,
            }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  nativePicker: {
    height: 44,
  },
});
