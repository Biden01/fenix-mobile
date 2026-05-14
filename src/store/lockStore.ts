import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'zharqyn_pin_hash';
const BIOMETRIC_KEY = 'zharqyn_biometric_enabled';

// Simple hash — XOR-fold SHA-like for PIN (4 digits, stored as hex string)
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + pin.length.toString();
}

interface LockState {
  isLocked: boolean;
  isPinSet: boolean;
  biometricEnabled: boolean;
  // Actions
  loadSettings: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  lock: () => void;
  unlock: () => void;
  setBiometricEnabled: (val: boolean) => Promise<void>;
}

export const useLockStore = create<LockState>((set) => ({
  isLocked: true,
  isPinSet: false,
  biometricEnabled: false,

  loadSettings: async () => {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    const bio = await SecureStore.getItemAsync(BIOMETRIC_KEY);
    set({ isPinSet: !!pin, biometricEnabled: bio === 'true' });
  },

  setPin: async (pin: string) => {
    await SecureStore.setItemAsync(PIN_KEY, hashPin(pin));
    set({ isPinSet: true });
  },

  removePin: async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    set({ isPinSet: false, biometricEnabled: false, isLocked: false });
  },

  verifyPin: async (pin: string) => {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    return stored === hashPin(pin);
  },

  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),

  setBiometricEnabled: async (val: boolean) => {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, val ? 'true' : 'false');
    set({ biometricEnabled: val });
  },
}));
