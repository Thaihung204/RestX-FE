'use client';
import { createContext, useContext } from 'react';

export type LanguageContextType = {
    language: string;
    changeLanguage: (lang: string) => void;
};

export const LanguageContext = createContext<LanguageContextType>({
    language: 'vi',
    changeLanguage: () => { },
});

export const useLanguage = () => useContext(LanguageContext);
