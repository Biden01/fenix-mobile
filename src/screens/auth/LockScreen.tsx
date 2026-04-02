import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import { Delete, Fingerprint } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '@/theme';
import { useLockStore } from '@/store/lockStore';
import { useAuthStore } from '@/store';

const PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', 'del'],
];

const PIN_LENGTH = 4;

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const theme = useTheme();
  const { verifyPin, biometricEnabled, unlock } = useLockStore();
  const { logout } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometric(compatible && enrolled && biometricEnabled);
  };

  const tryBiometric = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Войти в Fenix',
      fallbackLabel: 'Использовать PIN',
      cancelLabel: 'Отмена',
    });
    if (result.success) {
      unlock();
      onUnlock();
    }
  }, [unlock, onUnlock]);

  // Auto-trigger biometric on open
  useEffect(() => {
    if (hasBiometric) {
      setTimeout(tryBiometric, 400);
    }
  }, [hasBiometric]);

  const handleKey = async (key: string) => {
    if (key === 'bio') {
      tryBiometric();
      return;
    }
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      setError(false);
      return;
    }

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      const ok = await verifyPin(newPin);
      if (ok) {
        unlock();
        onUnlock();
      } else {
        Vibration.vibrate(400);
        setError(true);
        setAttempts((a) => {
          const next = a + 1;
          if (next >= 5) {
            Alert.alert(
              'Слишком много попыток',
              'Вы будете выйдены из аккаунта.',
              [{ text: 'OK', onPress: logout }]
            );
          }
          return next;
        });
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 600);
      }
    }
  };

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Logo / title */}
      <View style={styles.top}>
        <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: 32, color: theme.colors.goldForeground }}>
          Fenix
        </Text>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginTop: 8 }}>
          Введите PIN-код
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {dots.map((filled, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: error
                  ? theme.semantic.error
                  : filled
                  ? theme.colors.goldForeground
                  : 'transparent',
                borderColor: error
                  ? theme.semantic.error
                  : filled
                  ? theme.colors.goldForeground
                  : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Error hint */}
      <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.semantic.error, height: 18, marginBottom: 8 }}>
        {error ? `Неверный PIN${attempts > 2 ? ` (осталось ${5 - attempts} попыток)` : ''}` : ''}
      </Text>

      {/* Keypad */}
      <View style={styles.pad}>
        {PAD.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key) => {
              if (key === 'bio') {
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => handleKey('bio')}
                    style={[styles.key, { opacity: hasBiometric ? 1 : 0 }]}
                    disabled={!hasBiometric}
                  >
                    <Fingerprint size={28} color={theme.colors.goldForeground} />
                  </TouchableOpacity>
                );
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => handleKey('del')}
                    style={styles.key}
                  >
                    <Delete size={24} color={theme.colors.foreground} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleKey(key)}
                  style={[
                    styles.key,
                    styles.numKey,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  activeOpacity={0.6}
                >
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: 24, color: theme.colors.foreground }}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Logout link */}
      <TouchableOpacity onPress={logout} style={{ marginTop: 32 }}>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
          Выйти из аккаунта
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  top: { alignItems: 'center', marginBottom: 48 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pad: { gap: 12 },
  row: { flexDirection: 'row', gap: 16 },
  key: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
  },
  numKey: {
    borderWidth: 1,
  },
});
