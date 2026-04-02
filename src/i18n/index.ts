import { useLanguageStore } from '@/store';
import { translations } from './translations';

export function useT() {
  const { language } = useLanguageStore();
  return translations[language];
}

export type { Language, Translations } from './translations';
export { translations };
