import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle, ScrollView, RefreshControlProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  safeArea?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  padded = true,
  safeArea = true,
  style,
  contentContainerStyle,
  refreshControl,
}: ScreenWrapperProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const Container = safeArea ? SafeAreaView : View;

  const innerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(padded && {
      paddingHorizontal: theme.screenPadding.horizontal,
    }),
  };

  if (scrollable) {
    return (
      <Container style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <ScrollView
          style={innerStyle}
          contentContainerStyle={[
            {
              paddingBottom: theme.dimensions.tabBarHeight + Math.max(insets.bottom, theme.spacing[4]),
              paddingTop: theme.screenPadding.top,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <View
        style={[
          innerStyle,
          {
            paddingTop: theme.screenPadding.top,
            paddingBottom: theme.dimensions.tabBarHeight + Math.max(insets.bottom, theme.spacing[2]),
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
