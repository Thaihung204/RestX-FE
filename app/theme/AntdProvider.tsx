'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { lightTheme, darkTheme, ThemeMode } from './themeConfig';

const STORAGE_KEY = 'restx-theme-mode';

type ThemeContextValue = {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<ThemeMode>('light');

  // read initial
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) : null;
    if (stored === 'dark' || stored === 'light') {
      setMode(stored);
    }
  }, []);

  // apply CSS variables and persist
  useEffect(() => {
    const theme = mode === 'dark' ? darkTheme : lightTheme;
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    const vars = theme.customColors;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  const setTheme = (m: ThemeMode) => setMode(m);

  const themeTokens = useMemo(() => (mode === 'dark' ? darkTheme.tokens : lightTheme.tokens), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ConfigProvider theme={themeTokens}>
        <AntdApp>{children}</AntdApp>
    </ConfigProvider>
      <style jsx global>{`
        body {
          background: var(--bg-base);
          color: var(--text);
          transition: background 0.2s ease, color 0.2s ease;
        }
        .ant-layout,
        .ant-layout-content {
          background: var(--bg-base);
        }
        
        /* Scrollbar Styling - Webkit (Chrome, Safari, Edge) */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: var(--card);
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 5px;
          border: 2px solid var(--card);
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
        
        /* Scrollbar Styling - Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: var(--border) var(--card);
        }
        
        /* Ant Design Drawer/Modal scrollbar */
        .ant-drawer-body,
        .ant-modal-body {
          scrollbar-width: thin;
          scrollbar-color: var(--border) var(--card);
        }
        .ant-drawer-body::-webkit-scrollbar,
        .ant-modal-body::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .ant-drawer-body::-webkit-scrollbar-track,
        .ant-modal-body::-webkit-scrollbar-track {
          background: var(--card);
          border-radius: 4px;
        }
        .ant-drawer-body::-webkit-scrollbar-thumb,
        .ant-modal-body::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        .ant-drawer-body::-webkit-scrollbar-thumb:hover,
        .ant-modal-body::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </ThemeContext.Provider>
  );
}

