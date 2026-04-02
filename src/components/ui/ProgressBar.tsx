import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  height?: number;
  variant?: 'gold' | 'success' | 'info' | 'warning' | 'purple';
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  label,
  showPercentage = false,
  height,
  variant = 'gold',
  style,
}: ProgressBarProps) {
  const theme = useTheme();
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const progressHeight = height ?? theme.dimensions.progressHeight;

  const getColors = (): [string, string] => {
    switch (variant) {
      case 'success':
        return [theme.semantic.success, '#059669'];
      case 'info':
        return [theme.semantic.info, '#2563EB'];
      case 'warning':
        return [theme.semantic.warning, '#D97706'];
      case 'purple':
        return ['#A855F7', '#7C3AED'];
      default:
        return [theme.gold.primary, theme.gold.dark];
    }
  };

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text
              style={[
                styles.label,
                {
                  fontFamily: theme.fonts.regular,
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.mutedForeground,
                },
              ]}
            >
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text
              style={[
                styles.percentage,
                {
                  fontFamily: theme.fonts.medium,
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.foreground,
                },
              ]}
            >
              {Math.round(clampedValue)}%
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,
          {
            height: progressHeight,
            backgroundColor: theme.colors.muted,
            borderRadius: progressHeight / 2,
          },
        ]}
      >
        <LinearGradient
          colors={getColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.fill,
            {
              width: `${clampedValue}%`,
              height: progressHeight,
              borderRadius: progressHeight / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {},
  percentage: {},
  track: {
    overflow: 'hidden',
  },
  fill: {},
});
