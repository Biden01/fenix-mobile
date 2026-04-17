import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';

interface SectionHeaderProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  rightElement?: React.ReactNode;
}

export function SectionHeader({ title, badge, badgeColor, rightElement }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.md, color: theme.colors.foreground }}>
        {title}
      </Text>
      {badge && (
        <View style={{
          backgroundColor: theme.isDark
            ? `${badgeColor ?? theme.colors.goldForeground}18`
            : `${badgeColor ?? theme.colors.goldForeground}28`,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: theme.isDark
            ? `${badgeColor ?? theme.colors.goldForeground}30`
            : `${badgeColor ?? theme.colors.goldForeground}55`,
        }}>
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: badgeColor ?? theme.colors.goldForeground }}>
            {badge}
          </Text>
        </View>
      )}
      {rightElement}
    </View>
  );
}
