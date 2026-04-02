import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
  style?: ViewStyle;
}

export function Avatar({ source, name, size = 'md', showBorder = true, style }: AvatarProps) {
  const theme = useTheme();

  const getSize = () => {
    switch (size) {
      case 'sm':
        return theme.dimensions.avatarSmall;
      case 'lg':
        return theme.dimensions.avatarLarge;
      case 'xl':
        return theme.dimensions.avatarXLarge;
      default:
        return theme.dimensions.avatarMedium;
    }
  };

  const dimension = getSize();
  const fontSize = dimension * 0.4;

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const content = source ? (
    <Image
      source={{ uri: source }}
      style={[
        styles.image,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    />
  ) : (
    <LinearGradient
      colors={[theme.gold.primary, theme.gold.dark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.placeholder,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontFamily: theme.fonts.bold,
            fontSize: fontSize,
            color: theme.colors.primaryForeground,
          },
        ]}
      >
        {getInitials()}
      </Text>
    </LinearGradient>
  );

  if (showBorder) {
    return (
      <View
        style={[
          styles.container,
          {
            width: dimension + 4,
            height: dimension + 4,
            borderRadius: (dimension + 4) / 2,
            borderWidth: 2,
            borderColor: theme.gold.primary,
          },
          theme.shadows.md,
          style,
        ]}
      >
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    textAlign: 'center',
  },
});
