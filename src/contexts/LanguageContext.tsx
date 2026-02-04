"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Language, defaultLanguage, TranslationKey } from '@/src/types/i18n';
import th from '@/src/locales/th.json';
import en from '@/src/locales/en.json';

const translations: Record<Language, Record<string, string>> = {
  th,
  en,
};

const STORAGE_KEY = 'app-language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, options?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY) as Language;
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: TranslationKey, options?: Record<string, string>): string => {
    let translation = translations[language][key] || translations[defaultLanguage][key] || key;

    if (options) {
      Object.entries(options).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, v);
      });
    }

    return translation;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t
  }), [language, handleSetLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
