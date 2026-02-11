 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 
export type ThemeMode = "light" | "dark";
 
 function readThemeMode(): ThemeMode {
   const attr = document.documentElement.getAttribute("data-theme");
   return attr === "dark" ? "dark" : "light";
 }
 
 function readCssVar(name: string): string {
   return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
 }
 
function hexToRgb(hex: string) {
  const value = hex.replace("#", "").trim();
  if (![3, 4, 6, 8].includes(value.length)) return null;

  const expand = (s: string) => s.split("").map((c) => c + c).join("");
  const normalized =
    value.length === 3 || value.length === 4 ? expand(value) : value;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

function srgbToLinear(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: { r: number; g: number; b: number }) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function pickOnColor(primaryHex: string) {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) return "#FFFFFF";
  const L = relativeLuminance(rgb);
  // Simple, reliable heuristic: bright colors -> dark text, otherwise white text
  return L > 0.55 ? "#111111" : "#FFFFFF";
}

export type TenantBrandConfig = {
  baseColor?: string; // e.g. "#FF380B"
  headerColor?: string; // optional
  logoUrl?: string; // optional (stored as CSS var string)
};

/**
 * Inject tenant branding tokens onto <html> as CSS variables.
 * - Only seed tokens should be set here. Functional tokens are derived in CSS via color-mix.
 * - Also auto-sets readable text/icon color for primary backgrounds.
 */
export function injectTenantBranding(config: TenantBrandConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const base = (config.baseColor || "").trim() || "#FF380B";
  root.style.setProperty("--primary", base);

  if (config.headerColor && config.headerColor.trim()) {
    root.style.setProperty("--header-color", config.headerColor.trim());
  }

  if (config.logoUrl && config.logoUrl.trim()) {
    // This is useful for JS reading; CSS url(var(--brand-logo-url)) is not reliable across browsers.
    root.style.setProperty("--brand-logo-url", config.logoUrl.trim());
  }

  const onPrimary = pickOnColor(base);
  // Backward compatible name used in components, plus explicit semantic token.
  root.style.setProperty("--text-inverse", onPrimary);
  root.style.setProperty("--on-primary", onPrimary);
}

 export function useThemeTokens() {
   const [mode, setMode] = useState<ThemeMode>("light");
   const [tokens, setTokens] = useState(() => ({
     primary: "",
     primarySoft: "",
     primaryGlow: "",
     primaryHover: "",
     primaryBorder: "",
     primaryTint: "",
     bgBase: "",
     surface: "",
     card: "",
     text: "",
     textMuted: "",
     border: "",
     textInverse: "",
     onPrimary: "",
     shadowSm: "",
     shadowMd: "",
     shadowLg: "",
     modalOverlay: "",
     decorationGlow: "",
   }));
 
   useEffect(() => {
     const sync = () => {
       setMode(readThemeMode());
       setTokens({
         primary: readCssVar("--primary"),
         primarySoft: readCssVar("--primary-soft"),
         primaryGlow: readCssVar("--primary-glow"),
         primaryHover: readCssVar("--primary-hover"),
         primaryBorder: readCssVar("--primary-border"),
         primaryTint: readCssVar("--primary-tint"),
         bgBase: readCssVar("--bg-base"),
         surface: readCssVar("--surface"),
         card: readCssVar("--card"),
         text: readCssVar("--text"),
         textMuted: readCssVar("--text-muted"),
         border: readCssVar("--border"),
         textInverse: readCssVar("--text-inverse"),
         onPrimary: readCssVar("--on-primary"),
         shadowSm: readCssVar("--shadow-sm"),
         shadowMd: readCssVar("--shadow-md"),
         shadowLg: readCssVar("--shadow-lg"),
         modalOverlay: readCssVar("--modal-overlay"),
         decorationGlow: readCssVar("--decoration-glow"),
       });
     };
 
     sync();
 
     const observer = new MutationObserver(() => sync());
     observer.observe(document.documentElement, {
       attributes: true,
       // data-theme: user toggles light/dark
       // style: tenant injects CSS variables (branding)
       attributeFilter: ["data-theme", "style", "class"],
     });
 
     return () => observer.disconnect();
   }, []);
 
   return useMemo(
     () => ({
       mode,
       ...tokens,
     }),
     [mode, tokens],
   );
 }
