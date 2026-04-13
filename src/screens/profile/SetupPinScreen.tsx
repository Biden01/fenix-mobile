import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import { Delete } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { useLockStore } from '@/store/lockStore';
import { useT } from '@/i18n';

const PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', 'del'],
];

const PIN_LENGTH = 4;

type Step = 'enter' | 'confirm';

interface SetupPinScreenProps {
  onDone: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}

export function SetupPinScreen({ onDone, onCancel, cancelLabel }: SetupPinScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { setPin } = useLockStore();
  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin2] = useState('');
  const [error, setError] = useState('');

  const handleKey = async (key: string) => {
    if (key === 'del') {
      setPin2((p) => p.slice(0, -1));
      setError('');
      return;
    }

    const newPin = pin + key;
    setPin2(newPin);

    if (newPin.length === PIN_LENGTH) {
      if (step === 'enter') {
        setFirstPin(newPin);
        setPin2('');
        setStep('confirm');
      } else {
        if (newPin === firstPin) {
          await setPin(newPin);
          onDone();
        } else {
          Vibration.vibrate(400);
          setError(t.lock.pinMismatch);
          setPin2('');
          setStep('enter');
          setFirstPin('');
        }
      }
    }
  };

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.isDark
          ? ['#0a0a14', '#0f0f1e', '#0a0a14']
          : ['#f5f5f8', '#eeeef5', '#f5f5f8']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.top}>
        <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: 24, color: theme.colors.foreground }}>
          {step === 'enter' ? t.lock.createPin : t.lock.repeatPin}
        </Text>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
          {step === 'enter' ? t.lock.createPinHint : t.lock.repeatPinHint}
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
                backgroundColor: filled ? theme.colors.goldForeground : 'transparent',
                borderColor: filled ? theme.colors.goldForeground : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>

      <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.semantic.error, height: 18, marginBottom: 8 }}>
        {error}
      </Text>

      {/* Keypad */}
      <View style={styles.pad}>
        {PAD.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => {
              if (key === null) {
                return <View key={`null-${ki}`} style={styles.key} />;
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity key={key} onPress={() => handleKey('del')} style={styles.key}>
                    <Delete size={24} color={theme.colors.foreground} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleKey(key)}
                  style={[styles.key, styles.numKey]}
                  activeOpacity={0.7}
                >
                  <GlassCard cornerRadius={40} style={StyleSheet.absoluteFill} />
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: 24, color: theme.colors.foreground }}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onCancel} style={{ marginTop: 32 }}>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
          {cancelLabel ?? t.common.cancel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  top: { alignItems: 'center', marginBottom: 48 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pad: { gap: 14 },
  row: { flexDirection: 'row', gap: 18 },
  key: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 41, overflow: 'hidden' },
  numKey: {},
});
