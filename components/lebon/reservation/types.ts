'use client';

export interface LeBonBooking {
  date: string;
  time: string;
  guests: number;
}

export interface LeBonContact {
  name: string;
  phone: string;
  email: string;
  requests: string;
}

export interface LeBonSelectedTable {
  id: string;
  code: string;
  capacity: number;
  zone: string;
}

export const LB_TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30',
];

export const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

// ─── Shared style tokens ──────────────────────────────────────────────────────
export const LB = {
  font: {
    serif: 'var(--font-cormorant, "Cormorant Garamond", serif)',
    sans: 'var(--font-montserrat, Montserrat, sans-serif)',
  },
  color: {
    gold: 'var(--lb-gold, #c9a84c)',
    goldSoft: 'rgba(201,168,76,0.55)',
    goldFaint: 'rgba(201,168,76,0.08)',
    goldBorder: 'rgba(201,168,76,0.20)',
    goldBorder45: 'rgba(201,168,76,0.45)',
    text: 'var(--lb-text, #f5f0e8)',
    textMuted: 'color-mix(in srgb, var(--lb-text, #f5f0e8), transparent 50%)',
    surface: 'var(--lb-surface, #0f2316)',
    card: 'var(--lb-card, #0a1e10)',
    error: '#e07060',
    errorBg: 'rgba(220,80,60,0.10)',
    errorBorder: 'rgba(220,80,60,0.30)',
  },
  label: {
    fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: 'rgba(201,168,76,0.8)',
    display: 'block',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(201,168,76,0.20)',
    color: 'var(--lb-text, #f5f0e8)',
    fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
};
