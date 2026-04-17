import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function GoldButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}: GoldButtonProps) {
  const theme = useTheme();

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return theme.dimensions.buttonHeightSmall;
      case 'lg':
        return theme.dimensions.buttonHeightLarge;
      default:
        return theme.dimensions.buttonHeight;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return theme.fontSizes.base;
      case 'lg':
        return theme.fontSizes.lg;
      default:
        return theme.fontSizes.md;
    }
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#000000' : theme.colors.goldForeground}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              {
                fontFamily: theme.fonts.semibold,
                fontSize: getFontSize(),
                color:
                  variant === 'primary'
                    ? '#000000'
                    : variant === 'secondary'
                    ? theme.colors.foreground
                    : theme.colors.goldForeground,
                marginLeft: icon && iconPosition === 'left' ? theme.spacing[2] : 0,
                marginRight: icon && iconPosition === 'right' ? theme.spacing[2] : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  );

  const baseStyle: ViewStyle = {
    height: getHeight(),
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: theme.spacing[5],
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth ? { width: '100%' } : {}),
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        // Shadow on the wrapper — not on LinearGradient (causes Android artifacts)
        style={[theme.shadows.lg, { borderRadius: theme.borderRadius.xl }, style]}
      >
        <LinearGradient
          colors={[theme.gold.primary, theme.gold.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={baseStyle}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        baseStyle,
        variant === 'secondary' && {
          backgroundColor: theme.colors.secondary,
        },
        variant === 'outline' && {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.gold.primary,
        },
        variant === 'ghost' && {
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
});
