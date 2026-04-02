import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { GradientCard } from './GradientCard';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'gold';
  style?: ViewStyle;
}

export function StatCard({ icon, label, value, trend, variant = 'default', style }: StatCardProps) {
  const theme = useTheme();

  return (
    <GradientCard variant={variant === 'gold' ? 'gold' : 'default'} style={style}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: theme.colors.goldSurface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing[2],
            },
          ]}
        >
          {icon}
        </View>
        {trend && (
          <View
            style={[
              styles.trendContainer,
              {
                backgroundColor: trend.isPositive
                  ? `${theme.semantic.success}20`
                  : `${theme.semantic.error}20`,
                paddingHorizontal: theme.spacing[2],
                paddingVertical: 2,
                borderRadius: theme.borderRadius.full,
              },
            ]}
          >
            {trend.isPositive ? (
              <TrendingUp size={12} color={theme.semantic.success} />
            ) : (
              <TrendingDown size={12} color={theme.semantic.error} />
            )}
            <Text
              style={[
                styles.trendText,
                {
                  fontFamily: theme.fonts.medium,
                  fontSize: theme.fontSizes.xs,
                  color: trend.isPositive ? theme.semantic.success : theme.semantic.error,
                  marginLeft: 2,
                },
              ]}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[
          styles.label,
          {
            fontFamily: theme.fonts.regular,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.mutedForeground,
            marginTop: theme.spacing[2],
          },
        ]}
      >
        {label}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={[
          styles.value,
          {
            fontFamily: theme.fonts.bold,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.foreground,
            marginTop: theme.spacing[1],
          },
        ]}
      >
        {value}
      </Text>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {},
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {},
  label: {},
  value: {},
});
