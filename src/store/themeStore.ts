import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme } from '@/theme';

interface ThemeState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      colorScheme: 'light',

      setColorScheme: (scheme: ColorScheme) => {
        set({ colorScheme: scheme });
      },

      toggleColorScheme: () => {
        const { colorScheme } = get();
        set({ colorScheme: colorScheme === 'dark' ? 'light' : 'dark' });
      },
    }),
    {
      name: 'fenix-theme-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
