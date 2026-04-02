import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  style?: ViewStyle;
}

export function Tabs({ tabs, activeTab, onTabChange, style }: TabsProps) {
  const theme = useTheme();
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.key);

  const currentTab = activeTab ?? internalActiveTab;

  const handleTabPress = (key: string) => {
    setInternalActiveTab(key);
    onTabChange?.(key);
  };

  const manyTabs = tabs.length >= 5;

  const tabItems = tabs.map((tab) => {
    const isActive = currentTab === tab.key;
    return (
      <TouchableOpacity
        key={tab.key}
        onPress={() => handleTabPress(tab.key)}
        style={[
          styles.tab,
          {
            // For many tabs use fixed min-width; for few tabs stretch equally
            ...(manyTabs ? { paddingHorizontal: theme.spacing[3] } : { flex: 1 }),
            paddingVertical: theme.spacing[2],
            borderRadius: theme.borderRadius.md,
            backgroundColor: isActive ? theme.colors.card : 'transparent',
          },
          isActive && theme.shadows.sm,
        ]}
        activeOpacity={0.7}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.tabText,
            {
              fontFamily: isActive ? theme.fonts.semibold : theme.fonts.medium,
              fontSize: manyTabs ? theme.fontSizes.xs : theme.fontSizes.sm,
              color: isActive ? theme.colors.foreground : theme.colors.mutedForeground,
            },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (manyTabs) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.scrollContainer,
          {
            backgroundColor: theme.colors.muted,
            borderRadius: theme.borderRadius.lg,
          },
          style,
        ]}
        contentContainerStyle={{
          padding: theme.spacing[1],
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {tabItems}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.muted,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[1],
        },
        style,
      ]}
    >
      {tabItems}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  scrollContainer: {
    // height is determined by content
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    textAlign: 'center',
  },
});
