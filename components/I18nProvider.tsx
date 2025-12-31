'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';

const LanguageContext = createContext<{ language: string; changeLanguage: (lang: string) => void }>({
  language: 'vi',
  changeLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  // Initialize state from localStorage if available (client-side only)
  const getInitialLanguage = (): string => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language');
      if (savedLang === 'en' || savedLang === 'vi') {
        return savedLang;
      }
    }
    return i18n.language || 'vi';
  };

  const [language, setLanguage] = useState(getInitialLanguage);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get the correct language from localStorage or i18n
    const savedLang = typeof window !== 'undefined' 
      ? localStorage.getItem('language') 
      : null;
    const targetLang = (savedLang === 'en' || savedLang === 'vi') 
      ? savedLang 
      : (i18n.language || 'vi');

    // Ensure i18n and state are synchronized
    if (i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang).then(() => {
        setLanguage(targetLang);
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', targetLang);
        }
        setIsLoaded(true);
      });
    } else {
      setLanguage(targetLang);
      if (typeof window !== 'undefined' && targetLang) {
        localStorage.setItem('language', targetLang);
      }
      setIsLoaded(true);
    }

    // Listen for language changes from i18n
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lng);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang).then(() => {
      // Language will be updated via the languageChanged event
    });
  };

  // Don't render children until i18n is loaded to prevent hydration mismatch
  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
