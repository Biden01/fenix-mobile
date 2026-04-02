import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
}

export function GlassInput({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  isPassword = false,
  ...textInputProps
}: GlassInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              fontFamily: theme.fonts.medium,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.foreground,
              marginBottom: theme.spacing[2],
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.inputBackground,
            borderRadius: theme.borderRadius.xl,
            borderWidth: 1,
            borderColor: error
              ? theme.semantic.error
              : isFocused
              ? theme.gold.primary
              : theme.colors.border,
            height: theme.dimensions.inputHeight,
          },
        ]}
      >
        {leftIcon && (
          <View style={[styles.iconContainer, { marginLeft: theme.spacing[3] }]}>
            {leftIcon}
          </View>
        )}

        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            {
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.md,
              color: theme.colors.foreground,
              paddingHorizontal: theme.spacing[3],
              flex: 1,
            },
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.mutedForeground}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          secureTextEntry={isPassword && !showPassword}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={[styles.iconContainer, { marginRight: theme.spacing[3] }]}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.colors.mutedForeground} />
            ) : (
              <Eye size={20} color={theme.colors.mutedForeground} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <View style={[styles.iconContainer, { marginRight: theme.spacing[3] }]}>
            {rightIcon}
          </View>
        )}
      </View>

      {error && (
        <Text
          style={[
            styles.error,
            {
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.xs,
              color: theme.semantic.error,
              marginTop: theme.spacing[1],
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: '100%',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {},
});
