import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import { Delete } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useLockStore } from '@/store/lockStore';

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

export function SetupPinScreen({ onDone, onCancel, cancelLabel = 'Отмена' }: SetupPinScreenProps) {
  const theme = useTheme();
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
          setError('PIN-коды не совпадают. Попробуйте снова.');
          setPin2('');
          setStep('enter');
          setFirstPin('');
        }
      }
    }
  };

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.top}>
        <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: 24, color: theme.colors.foreground }}>
          {step === 'enter' ? 'Создайте PIN-код' : 'Повторите PIN-код'}
        </Text>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
          {step === 'enter'
            ? 'Введите 4-значный PIN для защиты приложения'
            : 'Введите PIN ещё раз для подтверждения'}
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
                  style={[styles.key, styles.numKey, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
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

      <TouchableOpacity onPress={onCancel} style={{ marginTop: 32 }}>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
          {cancelLabel}
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
  pad: { gap: 12 },
  row: { flexDirection: 'row', gap: 16 },
  key: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 40 },
  numKey: { borderWidth: 1 },
});
