import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';
import { GoldButton } from './GoldButton';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <View style={{ opacity: 0.3, marginBottom: 16 }}>
        {icon}
      </View>
      <Text style={{
        fontFamily: theme.fonts.semibold,
        fontSize: theme.fontSizes.lg,
        color: theme.colors.foreground,
        textAlign: 'center',
        marginBottom: description ? theme.spacing[2] : 0,
      }}>
        {title}
      </Text>
      {description && (
        <Text style={{
          fontFamily: theme.fonts.regular,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.mutedForeground,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: action ? theme.spacing[5] : 0,
        }}>
          {description}
        </Text>
      )}
      {action && (
        <GoldButton
          title={action.label}
          onPress={action.onPress}
          fullWidth={false}
          style={{ paddingHorizontal: 32 }}
        />
      )}
    </View>
  );
}
