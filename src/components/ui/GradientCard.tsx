import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

interface GradientCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'glass';
  padding?: number;
  style?: ViewStyle;
  noBorder?: boolean;
}

export function GradientCard({
  children,
  variant = 'default',
  padding,
  style,
  noBorder = false,
}: GradientCardProps) {
  const theme = useTheme();

  const getPadding = () => padding ?? theme.spacing[4];

  if (variant === 'gold') {
    if (Platform.OS === 'android') {
      // Android: elevation requires an explicit backgroundColor to render correctly.
      // Without it, Android uses the system surface (white/light), making the
      // low-opacity golden gradient appear cream/beige.
      // Solution: dark card background on the wrapper so the gradient blends correctly.
      return (
        <View
          style={[
            {
              borderRadius: theme.borderRadius['2xl'],
              backgroundColor: theme.colors.card,
              elevation: theme.shadows.lg.elevation,
              overflow: 'hidden',
            },
            style,
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.15)', 'rgba(218, 165, 32, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: getPadding(),
              borderWidth: noBorder ? 0 : 1,
              borderColor: 'rgba(255, 215, 0, 0.3)',
              borderRadius: theme.borderRadius['2xl'],
            }}
          >
            {children}
          </LinearGradient>
        </View>
      );
    }

    // iOS: shadow props work correctly on LinearGradient with overflow:hidden
    return (
      <View style={[{ borderRadius: theme.borderRadius['2xl'], overflow: 'hidden' }, style]}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.15)', 'rgba(218, 165, 32, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            {
              borderRadius: theme.borderRadius['2xl'],
              padding: getPadding(),
              borderWidth: noBorder ? 0 : 1,
              borderColor: 'rgba(255, 215, 0, 0.3)',
            },
            theme.shadows.lg,
          ]}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  if (variant === 'glass') {
    return (
      <View
        style={[
          {
            backgroundColor: theme.isDark ? 'rgba(15, 15, 24, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderRadius: theme.borderRadius['2xl'],
            padding: getPadding(),
            borderWidth: noBorder ? 0 : 1,
            borderColor: theme.colors.border,
          },
          theme.shadows.md,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius['2xl'],
          padding: getPadding(),
          borderWidth: noBorder ? 0 : 1,
          borderColor: theme.colors.border,
        },
        theme.shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}
