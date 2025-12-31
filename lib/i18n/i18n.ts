import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import vi from './locales/vi.json';

const resources = {
  en: {
    translation: en,
  },
  vi: {
    translation: vi,
  },
};

// Get initial language from localStorage or default to 'vi'
const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'en' || savedLang === 'vi') {
      return savedLang;
    }
  }
  return 'vi';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(), // Get language from localStorage or default to 'vi'
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false,
    },
    initImmediate: false,
  });

export default i18n;
