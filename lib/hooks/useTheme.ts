'use client';

import { useThemeMode } from '@/app/theme/AntdProvider';
import { useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

/**
 * Read current theme mode from DOM
 */
function readThemeMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}

/**
 * Read CSS variable value from DOM
 */
function readCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Unified theme hook - provides theme mode, controls, and all design tokens
 * Reactively syncs with DOM changes via MutationObserver
 * 
 * @example
 * const { mode, colors, toggleTheme, isDark } = useTheme();
 * <div style={{ background: colors.primary }}>Hello</div>
 */
export function useTheme() {
  const { mode: contextMode, toggleTheme, setTheme } = useThemeMode();
  const [mode, setMode] = useState<ThemeMode>('light');
  const [tokens, setTokens] = useState(() => ({
    primary: '',
    primarySoft: '',
    primaryGlow: '',
    primaryHover: '',
    primaryBorder: '',
    primaryTint: '',
    bgBase: '',
    surface: '',
    card: '',
    text: '',
    textMuted: '',
    border: '',
    textInverse: '',
    onPrimary: '',
    shadowSm: '',
    shadowMd: '',
    shadowLg: '',
    modalOverlay: '',
    decorationGlow: '',
    danger: '',
    success: '',
    warning: '',
  }));

  // Sync theme mode and CSS variables from DOM
  useEffect(() => {
    const sync = () => {
      setMode(readThemeMode());
      setTokens({
        primary: readCssVar('--primary'),
        primarySoft: readCssVar('--primary-soft'),
        primaryGlow: readCssVar('--primary-glow'),
        primaryHover: readCssVar('--primary-hover'),
        primaryBorder: readCssVar('--primary-border'),
        primaryTint: readCssVar('--primary-tint'),
        bgBase: readCssVar('--bg-base'),
        surface: readCssVar('--surface'),
        card: readCssVar('--card'),
        text: readCssVar('--text'),
        textMuted: readCssVar('--text-muted'),
        border: readCssVar('--border'),
        textInverse: readCssVar('--text-inverse'),
        onPrimary: readCssVar('--on-primary'),
        shadowSm: readCssVar('--shadow-sm'),
        shadowMd: readCssVar('--shadow-md'),
        shadowLg: readCssVar('--shadow-lg'),
        modalOverlay: readCssVar('--modal-overlay'),
        decorationGlow: readCssVar('--decoration-glow'),
        danger: readCssVar('--danger'),
        success: readCssVar('--success'),
        warning: readCssVar('--warning'),
      });
    };

    sync();

    // Watch for theme changes (data-theme attribute, style changes, class changes)
    const observer = new MutationObserver(() => sync());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  // Memoized return object
  const result = useMemo(
    () => ({
      mode,
      toggleTheme,
      setTheme,
      colors: tokens,
      isDark: mode === 'dark',
      // Convenience aliases for common tokens
      primary: tokens.primary,
      text: tokens.text,
      bgBase: tokens.bgBase,
      surface: tokens.surface,
    }),
    [mode, tokens, toggleTheme, setTheme]
  );

  return result;
}
