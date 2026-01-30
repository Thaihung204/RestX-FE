'use client';

import React, { useState } from 'react';
import { useLanguage } from './I18nProvider';

interface LanguageSwitcherProps {
  style?: React.CSSProperties;
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style, className }) => {
  const { language, changeLanguage } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <div className={`relative ${className || ''}`} style={style}>
      <button
        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
        className="p-2 rounded-lg transition-colors group flex items-center gap-2"
        style={{
          background: "var(--surface)",
          color: "var(--text-muted)",
          border: "1px solid var(--border)"
        }}
      >
        <img
          src={language === 'vi' ? "https://flagcdn.com/w40/vn.png" : "https://flagcdn.com/w40/gb.png"}
          alt={language}
          className="w-6 h-4 object-cover rounded-[2px] shadow-sm"
        />
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isLangMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsLangMenuOpen(false)}
          />
          <div
            className="absolute top-full right-0 mt-2 w-40 rounded-xl shadow-lg border p-1 z-40 transition-all"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <button
              onClick={() => {
                changeLanguage("en");
                setIsLangMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${language === "en" ? "bg-orange-500/10 text-orange-500" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              style={{ color: language === "en" ? undefined : "var(--text)" }}
            >
              <img
                src="https://flagcdn.com/w40/gb.png"
                alt="English"
                className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm"
              />
              <span>English</span>
            </button>
            <button
              onClick={() => {
                changeLanguage("vi");
                setIsLangMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${language === "vi" ? "bg-orange-500/10 text-orange-500" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              style={{ color: language === "vi" ? undefined : "var(--text)" }}
            >
              <img
                src="https://flagcdn.com/w40/vn.png"
                alt="Tiếng Việt"
                className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm"
              />
              <span>Tiếng Việt</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
