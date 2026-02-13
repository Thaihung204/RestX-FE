"use client";

import {
  THEME_COLOR_FIELDS,
  THEME_COLOR_MAP,
  type ThemeColorField,
} from "@/lib/constants/themeDefaults";

/**
 * Tenant Branding Injection
 *
 * Overrides CSS variables only when DB has non-empty values.
 * Empty fields → CSS variable removed → globals.css defaults apply naturally.
 */

export type TenantBrandConfig = Partial<Record<ThemeColorField, string>> & {
  logoUrl?: string;
};

// ── Color utilities (WCAG contrast) ──────────────────────────────

function hexToRgb(hex: string) {
  const v = hex.replace("#", "").trim();
  if (![3, 4, 6, 8].includes(v.length)) return null;
  const n = v.length <= 4 ? v.split("").map((c) => c + c).join("") : v;
  const [r, g, b] = [n.slice(0, 2), n.slice(2, 4), n.slice(4, 6)].map((s) =>
    parseInt(s, 16),
  );
  return [r, g, b].some(Number.isNaN) ? null : { r, g, b };
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Returns black or white for readable text on the given background */
function pickOnColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#FFFFFF";
  return luminance(rgb) > 0.55 ? "#111111" : "#FFFFFF";
}

// ── Main injection ───────────────────────────────────────────────

/**
 * Apply tenant brand colors as CSS custom properties on <html>.
 * - Non-empty DB value → override CSS variable
 * - Empty/missing → remove override → globals.css default applies
 * - Auto-calculates readable text-on-primary color
 * - Caches to localStorage for FOUC prevention
 */
export function injectTenantBranding(config: TenantBrandConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Apply each theme color: set if present, remove if empty
  for (const field of THEME_COLOR_FIELDS) {
    const value = (config[field] || "").trim();
    if (value) {
      root.style.setProperty(THEME_COLOR_MAP[field].cssVar, value);
    } else {
      root.style.removeProperty(THEME_COLOR_MAP[field].cssVar);
    }
  }

  // Logo URL
  if (config.logoUrl?.trim()) {
    root.style.setProperty("--brand-logo-url", config.logoUrl.trim());
  }

  // Auto-calculate readable text color for primary backgrounds
  const primary = (config.primaryColor || "").trim();
  if (primary) {
    const onPrimary = pickOnColor(primary);
    root.style.setProperty("--text-inverse", onPrimary);
    root.style.setProperty("--on-primary", onPrimary);
  }

  // Cache to localStorage for FOUC prevention
  try {
    localStorage.setItem("restx-tenant-colors", JSON.stringify(config));
  } catch {
    // localStorage may be unavailable
  }
}
