import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ur from './locales/ur.json';
import pa from './locales/pa.json';

export type SupportedLanguage = 'en' | 'ur' | 'pa';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'pa', name: 'Punjabi (Shahmukhi)', nativeName: 'شاہ مکھی پنجابی', dir: 'rtl' },
];

export const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ur', 'pa']);

export const getLanguageDirection = (lang: string): 'ltr' | 'rtl' => {
  const normalized = lang.split('-')[0]?.toLowerCase() || 'en';
  return RTL_LANGUAGES.has(normalized) ? 'rtl' : 'ltr';
};

export const applyDocumentLanguageDirection = (lang: string): void => {
  if (typeof document === 'undefined') return;
  const dir = getLanguageDirection(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.body.dir = dir;
  if (dir === 'rtl') {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
      pa: { translation: pa },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ur', 'pa'],
    interpolation: {
      escapeValue: false, // React escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'beej_dost_language',
      caches: ['localStorage'],
    },
  });

// Synchronize DOM attributes upon language change
i18n.on('languageChanged', (lng) => {
  applyDocumentLanguageDirection(lng);
});

// Initial application
if (typeof document !== 'undefined') {
  applyDocumentLanguageDirection(i18n.resolvedLanguage || i18n.language || 'en');
}

export default i18n;
