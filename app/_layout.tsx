import React, { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, Alert, View, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, createTheme } from '@/theme';
import { useThemeStore, useAuthStore } from '@/store';
import { useLockStore } from '@/store/lockStore';
import { LockScreen } from '@/screens/auth/LockScreen';
import { SetupPinScreen } from '@/screens/profile/SetupPinScreen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function RootLayout() {
  const [ready, setReady] = useState(false);
  const { colorScheme } = useThemeStore();
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const { isLocked, isPinSet, lock, unlock, loadSettings, setBiometricEnabled } = useLockStore();
  const theme = createTheme(colorScheme);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)/(home)');
    }
  }, [isAuthenticated, ready, segments]);

  // Lock when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current === 'background' &&
        nextState === 'active' &&
        isPinSet &&
        isAuthenticated
      ) {
        lock();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isPinSet, isAuthenticated, lock]);

  const handlePinSetupDone = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (compatible && enrolled) {
      Alert.alert(
        'Face ID',
        'Хотите использовать Face ID для быстрого входа?',
        [
          { text: 'Не сейчас', onPress: () => unlock() },
          {
            text: 'Включить',
            onPress: async () => {
              await setBiometricEnabled(true);
              unlock();
            },
          },
        ]
      );
    } else {
      unlock();
    }
  };

  useEffect(() => {
    const hardCap = setTimeout(() => setReady(true), 3000);

    async function prepare() {
      try {
        const fontLoad = Font.loadAsync({
          Montserrat_400Regular,
          Montserrat_500Medium,
          Montserrat_600SemiBold,
          Montserrat_700Bold,
          PlayfairDisplay_400Regular,
          PlayfairDisplay_700Bold,
        });
        const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2500));
        await Promise.race([fontLoad, timeout]);
      } catch (e) {
        console.warn('Error loading fonts:', e);
      } finally {
        clearTimeout(hardCap);
        setReady(true);
      }
    }

    prepare();
    return () => clearTimeout(hardCap);
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={theme}>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <Slot />
            {/* Mandatory PIN setup — shown once after first login */}
            {isAuthenticated && !isPinSet && (
              <View style={StyleSheet.absoluteFill}>
                <SetupPinScreen
                  onDone={handlePinSetupDone}
                  onCancel={logout}
                  cancelLabel="Выйти из аккаунта"
                />
              </View>
            )}
            {/* Lock screen — shown on every launch and background return */}
            {isAuthenticated && isPinSet && isLocked && (
              <LockScreen onUnlock={unlock} />
            )}
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
