import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface CompactHeaderProps {
  onBack: () => void;
  title: string;
  right?: React.ReactNode;
  paddingTop?: number;
  paddingBottom?: number;
  variant?: 'back' | 'close';
  titleAlign?: 'left' | 'center';
}

export function CompactHeader({
  onBack,
  title,
  right,
  paddingTop,
  paddingBottom,
  variant = 'back',
  titleAlign = 'left',
}: CompactHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const resolvedPaddingTop = paddingTop ?? insets.top + theme.spacing[2];
  const resolvedPaddingBottom = paddingBottom ?? theme.spacing[3];
  const Icon = variant === 'close' ? X : ArrowLeft;

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: resolvedPaddingTop,
      paddingHorizontal: theme.screenPadding.horizontal,
      paddingBottom: resolvedPaddingBottom,
    }}>
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={variant === 'close' ? 'Close' : 'Go back'}
      >
        <Icon size={20} color={theme.colors.foreground} />
      </TouchableOpacity>
      <Text style={{
        fontFamily: theme.fonts.bold,
        fontSize: theme.fontSizes.xl,
        color: theme.colors.foreground,
        flex: 1,
        textAlign: titleAlign,
      }}>
        {title}
      </Text>
      {right}
    </View>
  );
}
