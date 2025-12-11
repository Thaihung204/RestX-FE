'use client';

import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConfigProvider, theme } from "antd";
import { lightTheme, darkTheme, ThemeMode } from "./themeConfig";

const { darkAlgorithm, defaultAlgorithm } = theme;
const STORAGE_KEY = "restx-theme-mode";

type ThemeContextValue = {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

const AutoDarkThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Initialize from localStorage immediately to prevent flash
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "dark" || stored === "light") {
        return stored;
      }
      // Fallback to OS preference
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      return media.matches ? "dark" : "light";
    }
    return "light";
  });

  // Detect OS + stored preference on mount
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "dark" || stored === "light") {
      setMode(stored);
    } else {
      setMode(media.matches ? "dark" : "light");
    }
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (!saved) setMode(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Apply CSS variables + persist
  useEffect(() => {
    const themeObj = mode === "dark" ? darkTheme : lightTheme;
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    Object.entries(themeObj.customColors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val);
    });
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () => setMode((prev) => (prev === "light" ? "dark" : "light"));
  const setTheme = (m: ThemeMode) => setMode(m);

  const algorithm = useMemo(
    () => (mode === "dark" ? darkAlgorithm : defaultAlgorithm),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ConfigProvider
        theme={{
          algorithm,
          token: (mode === "dark" ? darkTheme : lightTheme).tokens.token,
          components: (mode === "dark" ? darkTheme : lightTheme).tokens.components,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default AutoDarkThemeProvider;

