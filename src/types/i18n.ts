import en from '@/src/locales/en.json';

export type Language = 'th' | 'en';

export const defaultLanguage: Language = 'th';

export type TranslationKey = keyof typeof en;
