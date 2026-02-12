"use client";

/**
 * Tenant Branding Utilities
 *
 * This module provides utilities for injecting tenant-specific branding
 * (colors, logos) as CSS variables. Used by TenantContext to apply
 * dynamic per-tenant theming.
 *
 * For general theme access, use: import { useTheme } from '@/lib/hooks/useTheme'
 */

export type TenantBrandConfig = {
  baseColor?: string; // Primary brand color (maps to --primary)
  logoUrl?: string; // Logo URL

  // Note: Background/surface colors are NOT customizable per tenant
  // They use fixed defaults from globals.css to ensure consistent UX
  // Only primary brand color can be customized
};

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string) {
  const value = hex.replace("#", "").trim();
  if (![3, 4, 6, 8].includes(value.length)) return null;

  const expand = (s: string) =>
    s
      .split("")
      .map((c) => c + c)
      .join("");
  const normalized =
    value.length === 3 || value.length === 4 ? expand(value) : value;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

/**
 * Convert sRGB color component to linear RGB
 */
function srgbToLinear(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance of RGB color
 */
function relativeLuminance(rgb: { r: number; g: number; b: number }) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Pick readable text color (black or white) based on background luminance
 * Uses WCAG contrast ratio algorithm
 */
function pickOnColor(primaryHex: string) {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) return "#FFFFFF";
  const L = relativeLuminance(rgb);
  // Simple, reliable heuristic: bright colors -> dark text, otherwise white text
  return L > 0.55 ? "#111111" : "#FFFFFF";
}

/**
 * Inject tenant branding tokens onto <html> as CSS variables.
 * - Only primary color is customizable per tenant
 * - Background/surface colors use fixed defaults from globals.css for consistent UX
 * - Auto-calculates readable text color for primary backgrounds
 * - Caches to localStorage for instant preload on next visit (prevents FOUC)
 *
 * ⚠️ Performance: This is optimized to run only when tenant config changes.
 * MutationObserver in useThemeTokens is debounced to prevent excessive re-renders.
 */
export function injectTenantBranding(config: TenantBrandConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // ✅ Primary brand color (only customizable field)
  const primary = (config.baseColor || "").trim() || "#FF380B";
  root.style.setProperty("--primary", primary);

  // ✅ Logo URL
  if (config.logoUrl && config.logoUrl.trim()) {
    root.style.setProperty("--brand-logo-url", config.logoUrl.trim());
  }

  // ✅ Auto-calculate readable text color for primary backgrounds
  const onPrimary = pickOnColor(primary);
  root.style.setProperty("--text-inverse", onPrimary);
  root.style.setProperty("--on-primary", onPrimary);

  // ✅ Cache to localStorage for instant preload on next visit (prevents FOUC)
  try {
    localStorage.setItem(
      "restx-tenant-colors",
      JSON.stringify({
        primary,
        onPrimary,
      }),
    );
  } catch (e) {
    // localStorage may be disabled, ignore silently
  }
}
