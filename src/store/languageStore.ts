import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '@/i18n/translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ru' as Language,
      setLanguage: (language: Language) => set({ language }),
    }),
    {
      name: 'fenix-language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
