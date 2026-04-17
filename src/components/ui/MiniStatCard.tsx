import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface MiniStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
}

export function MiniStatCard({ icon, label, value, iconBg, badge, badgeColor }: MiniStatCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
    }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground, marginBottom: 3 }}>
        {label}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
        style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.lg, color: theme.colors.foreground }}>
        {value}
      </Text>
      {badge && badgeColor && (
        <View style={{ backgroundColor: `${badgeColor}18`, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' }}>
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: 9, color: badgeColor }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
});
