'use client';

import { LeBonReservationModal } from '@/components/lebon/LeBonReservationModal';
import { injectTenantBranding } from '@/lib/hooks/useThemeTokens';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import NextImage from 'next/image';
import { useEffect, useRef, useState } from 'react';

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});
const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

// ─── Le Bon mock branding (thay bằng API call khi có DB) ─────────────────────
const LEBON_BRANDING = {
  primaryColor:      '#c9a84c',
  lightBaseColor:    '#f5f0e8',
  lightSurfaceColor: '#ede8dc',
  lightCardColor:    '#faf7f2',
  darkBaseColor:     '#0a1810',
  darkSurfaceColor:  '#0f2316',
  darkCardColor:     '#152b1c',
} as const;

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const SIGNATURE_DISHES = [
  {
    name: 'Bò Bít Tết Ribeye',
    french: 'Côte de Bœuf Grillée',
    desc: 'Ribeye Úc 300g, sốt Béarnaise truyền thống, khoai tây nghiền bơ Pháp',
    price: '485.000₫',
    tag: "Chef's Choice",
    img: '/images/restaurant/dish1.png',
  },
  {
    name: 'Bò Phi Lê Tenderloin',
    french: 'Filet de Bœuf au Poivre',
    desc: 'Tenderloin Mỹ 250g, sốt tiêu đen cognac, rau củ nướng thảo mộc',
    price: '520.000₫',
    tag: 'Signature',
    img: '/images/restaurant/dish2.png',
  },
  {
    name: 'Cá Hồi Áp Chảo',
    french: 'Saumon Poêlé à la Française',
    desc: 'Cá hồi Na Uy, sốt bơ chanh dill, măng tây xanh, cà chua bi nướng',
    price: '320.000₫',
    tag: 'Seasonal',
    img: '/images/restaurant/dish3.png',
  },
  {
    name: 'Gà Rôti Kiểu Pháp',
    french: 'Poulet Rôti aux Herbes',
    desc: 'Gà thả vườn nướng thảo mộc Provence, sốt jus tự nhiên, khoai tây rôti',
    price: '285.000₫',
    tag: 'Classic',
    img: '/images/restaurant/dish4.png',
  },
  {
    name: 'Sườn Cừu Nướng',
    french: 'Carré d\'Agneau Rôti',
    desc: 'Sườn cừu Úc, sốt rosemary-garlic, đậu lăng Pháp, rau củ nướng',
    price: '560.000₫',
    tag: 'Premium',
    img: '/images/restaurant/dish5.png',
  },
  {
    name: 'Vịt Confit',
    french: 'Confit de Canard',
    desc: 'Đùi vịt confit 48h, sốt cam cognac, khoai tây sarladaise, salad xanh',
    price: '395.000₫',
    tag: 'Classic',
    img: '/images/restaurant/dish6.png',
  },
];

const EXPERIENCES = [
  {
    roman: 'I',
    title: 'Thịt Nhập Khẩu Cao Cấp',
    desc: 'Nguồn nguyên liệu từ Úc, Mỹ, Nhật — được chọn lọc kỹ lưỡng mỗi ngày',
  },
  {
    roman: 'II',
    title: 'Bếp Trưởng Pháp',
    desc: 'Đội ngũ bếp được đào tạo tại Paris, mang kỹ thuật nấu ăn cổ điển Pháp',
  },
  {
    roman: 'III',
    title: 'Hầm Rượu Vang',
    desc: 'Hơn 80 nhãn vang Pháp được tuyển chọn, phù hợp với từng món ăn',
  },
  {
    roman: 'IV',
    title: 'Không Gian Riêng Tư',
    desc: 'Thiết kế lấy cảm hứng từ bistro Paris — ấm cúng, tinh tế, riêng tư',
  },
];

const GALLERY = [
  '/images/restaurant/warm_restaurant.webp',
  '/images/restaurant/dish5.png',
  '/images/restaurant/dish6.png',
  '/images/restaurant/bush_restaurant.webp',
];

// ─── Ornament SVG ─────────────────────────────────────────────────────────────
function Ornament({ color = 'var(--lb-gold)', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ display: 'inline-block' }}>
      <rect x="6" y="0" width="2" height="14" fill={color} opacity="0.6" />
      <rect x="0" y="6" width="14" height="2" fill={color} opacity="0.6" />
      <rect x="4" y="4" width="6" height="6" fill={color} />
    </svg>
  );
}

function GoldDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '0 auto', maxWidth: 260 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, var(--lb-gold))' }} />
      <Ornament />
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, var(--lb-gold))' }} />
    </div>
  );
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
type RevealDir = 'up' | 'left' | 'right' | 'fade';
function Reveal({
  children, dir = 'up', delay = 0, className,
}: {
  children: React.ReactNode; dir?: RevealDir; delay?: number; className?: string;
}) {
  const { ref, visible } = useReveal();
  const translate = dir === 'up' ? 'translateY(36px)' : dir === 'left' ? 'translateX(-40px)' : dir === 'right' ? 'translateX(40px)' : 'none';
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : translate,
        transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar({ onMenuOpen, onReserve, dark, onToggleDark }: {
  onMenuOpen: () => void;
  onReserve: () => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links = [
    { label: 'Thực Đơn', action: onMenuOpen },
    { label: 'Trải Nghiệm', href: '#experience' },
    { label: 'Thư Viện', href: '#gallery' },
    { label: 'Liên Hệ', href: '#contact' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? 'rgba(12,28,18,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--lb-gold-20)' : 'none',
      transition: 'all 0.5s ease',
      padding: '0 40px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <a href="#hero" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <NextImage src="/images/restaurant/lebon-logo.png" alt="Le Bon" width={40} height={40}
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 600, color: 'var(--lb-text)', letterSpacing: 4 }}>LE BON</span>
        </a>

        {/* Desktop */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }} className="lb-desktop-nav">
          {links.map(l => (
            l.action
              ? <button key={l.label} onClick={l.action} style={{
                  fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
                  color: 'color-mix(in srgb, var(--lb-text), transparent 20%)', letterSpacing: 2.5, background: 'none',
                  border: 'none', cursor: 'pointer', textTransform: 'uppercase', padding: 0,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--lb-gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'color-mix(in srgb, var(--lb-text), transparent 20%)')}
              >{l.label}</button>
              : <a key={l.label} href={l.href} style={{
                  fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
                  color: 'color-mix(in srgb, var(--lb-text), transparent 20%)', letterSpacing: 2.5, textDecoration: 'none',
                  textTransform: 'uppercase', transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--lb-gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'color-mix(in srgb, var(--lb-text), transparent 20%)')}
              >{l.label}</a>
          ))}

          {/* Theme toggle icon button */}
          <button
            onClick={onToggleDark}
            title={dark ? 'Chuyển sang Light mode' : 'Chuyển sang Dark mode'}
            style={{
              width: 32, height: 32,
              background: 'transparent',
              border: '1px solid var(--lb-gold-30)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-30)'; }}
          >
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--lb-gold)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--lb-gold)" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <button onClick={onReserve} style={{
            fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
            letterSpacing: 2.5, textTransform: 'uppercase',
            background: 'transparent', border: '1px solid var(--lb-gold)',
            color: 'var(--lb-gold)', padding: '10px 26px', cursor: 'pointer', transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--lb-gold)'; e.currentTarget.style.color = 'var(--lb-surface)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--lb-gold)'; }}
          >Đặt Bàn</button>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMobileOpen(v => !v)} className="lb-mobile-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none', flexDirection: 'column', gap: 5, padding: 4 }}>
          {[0, 1, 2].map(i => <span key={i} style={{ display: 'block', width: 22, height: 1.5, background: 'var(--lb-text)' }} />)}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ background: 'rgba(12,28,18,0.98)', padding: '16px 40px 28px', borderTop: '1px solid var(--lb-gold-15)' }}>
          {links.map(l => (
            l.action
              ? <button key={l.label} onClick={() => { setMobileOpen(false); l.action!(); }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  fontFamily: 'var(--font-montserrat)', fontSize: 11, color: 'color-mix(in srgb, var(--lb-text), transparent 20%)',
                  letterSpacing: 2, background: 'none', border: 'none', cursor: 'pointer',
                  textTransform: 'uppercase', padding: '12px 0',
                  borderBottom: '1px solid var(--lb-gold-10)',
                }}>{l.label}</button>
              : <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} style={{
                  display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: 11,
                  color: 'color-mix(in srgb, var(--lb-text), transparent 20%)', letterSpacing: 2, textDecoration: 'none',
                  textTransform: 'uppercase', padding: '12px 0',
                  borderBottom: '1px solid var(--lb-gold-10)',
                }}>{l.label}</a>
          ))}
          <button onClick={() => { setMobileOpen(false); onReserve(); }} style={{
            marginTop: 20, width: '100%', fontFamily: 'var(--font-montserrat)', fontSize: 11,
            fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
            background: 'var(--lb-gold)', border: 'none', color: 'var(--lb-surface)', padding: '13px', cursor: 'pointer',
          }}>Đặt Bàn Ngay</button>
          <button onClick={() => { setMobileOpen(false); onToggleDark(); }} style={{
            marginTop: 8, width: '100%', fontFamily: 'var(--font-montserrat)', fontSize: 10,
            letterSpacing: 2, textTransform: 'uppercase',
            background: 'transparent', border: '1px solid var(--lb-gold-30)',
            color: 'var(--lb-gold)', padding: '11px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {dark ? (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Light Mode</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Dark Mode</>
            )}
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ onMenuOpen }: { onMenuOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);

  return (
    <section id="hero" style={{ position: 'relative', height: '100vh', minHeight: 640, overflow: 'hidden' }}>
      <NextImage src="/images/restaurant/banner-lebon.png" alt="Le Bon" fill priority
        style={{ objectFit: 'cover', objectPosition: 'center', scale: loaded ? '1' : '1.04', transition: 'scale 1.8s cubic-bezier(0.22,1,0.36,1)' }} />

      {/* Layered overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,20,12,0.55) 0%, rgba(8,20,12,0.25) 40%, rgba(8,20,12,0.7) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8,20,12,0.5) 100%)' }} />

      {/* Corner ornaments */}
      {[
        { top: 96, left: 56 }, { top: 96, right: 56 },
        { bottom: 72, left: 56 }, { bottom: 72, right: 56 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', width: 72, height: 72,
          borderTop: i < 2 ? '1px solid var(--lb-gold-45)' : undefined,
          borderBottom: i >= 2 ? '1px solid var(--lb-gold-45)' : undefined,
          borderLeft: i % 2 === 0 ? '1px solid var(--lb-gold-45)' : undefined,
          borderRight: i % 2 === 1 ? '1px solid var(--lb-gold-45)' : undefined,
          opacity: loaded ? 1 : 0,
          transition: `opacity 1.2s ease ${600 + i * 120}ms`,
          ...pos,
        }} />
      ))}

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px',
      }}>
        <p style={{
          fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
          letterSpacing: 7, color: 'var(--lb-gold)', textTransform: 'uppercase', marginBottom: 24,
          opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(16px)',
          transition: 'opacity 1s ease 200ms, transform 1s ease 200ms',
        }}>Est. 2023 · Đà Nẵng</p>

        <div style={{
          opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(20px) scale(0.92)',
          transition: 'opacity 1s ease 350ms, transform 1s ease 350ms', marginBottom: 28,
        }}>
          <NextImage src="/images/restaurant/lebon-logo.png" alt="Le Bon" width={76} height={76}
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(56px, 9vw, 104px)',
          fontWeight: 300, color: 'var(--lb-text)', letterSpacing: 10, margin: '0 0 6px',
          lineHeight: 1, textTransform: 'uppercase',
          opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(24px)',
          transition: 'opacity 1.1s ease 480ms, transform 1.1s ease 480ms',
        }}>Le Bon</h1>

        <p style={{
          fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(16px, 2.5vw, 24px)',
          fontStyle: 'italic', fontWeight: 300, color: 'color-mix(in srgb, var(--lb-text), transparent 30%)',
          letterSpacing: 4, marginBottom: 36,
          opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(16px)',
          transition: 'opacity 1s ease 620ms, transform 1s ease 620ms',
        }}>Steak & Wine · French Cuisine</p>

        <div style={{
          opacity: loaded ? 1 : 0, transition: 'opacity 1s ease 750ms',
        }}>
          <GoldDivider />
        </div>

        <p style={{
          fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(15px, 2vw, 20px)',
          fontStyle: 'italic', color: 'color-mix(in srgb, var(--lb-text), transparent 35%)', marginTop: 28, marginBottom: 52,
          maxWidth: 440, lineHeight: 1.8,
          opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(12px)',
          transition: 'opacity 1s ease 880ms, transform 1s ease 880ms',
        }}>
          Xa hoa kiểu Pháp, định nghĩa lại sự thanh lịch
        </p>

        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
          opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(16px)',
          transition: 'opacity 1s ease 1000ms, transform 1s ease 1000ms',
        }}>
          <button onClick={onMenuOpen} style={{
            fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
            letterSpacing: 3, textTransform: 'uppercase',
            background: 'var(--lb-gold)', border: 'none', color: 'var(--lb-surface)',
            padding: '16px 44px', cursor: 'pointer', transition: 'all 0.35s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--lb-gold-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--lb-gold)'; e.currentTarget.style.transform = 'none'; }}
          >Khám Phá Thực Đơn</button>

          <a href="#about" style={{
            fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
            letterSpacing: 3, textTransform: 'uppercase',
            background: 'transparent', border: '1px solid color-mix(in srgb, var(--lb-text), transparent 55%)',
            color: 'var(--lb-text)', padding: '16px 44px', textDecoration: 'none',
            display: 'inline-block', transition: 'all 0.35s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lb-gold)'; e.currentTarget.style.color = 'var(--lb-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--lb-text), transparent 55%)'; e.currentTarget.style.color = 'var(--lb-text)'; }}
          >Về Chúng Tôi</a>
        </div>
      </div>

      {/* Scroll line */}
      <div style={{
        position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        opacity: loaded ? 1 : 0, transition: 'opacity 1s ease 1300ms',
      }}>
        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 4, color: 'var(--lb-gold-60)', textTransform: 'uppercase' }}>Scroll</span>
        <div style={{
          width: 1, height: 48,
          background: 'linear-gradient(to bottom, var(--lb-gold-60), transparent)',
          animation: 'lb-scroll-pulse 2s ease-in-out infinite',
        }} />
      </div>
    </section>
  );
}

// ─── Menu Overlay ─────────────────────────────────────────────────────────────
function MenuOverlay({ open, onClose, onReserve }: { open: boolean; onClose: () => void; onReserve: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      document.body.style.overflow = '';
      const t = setTimeout(() => setMounted(false), 600);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(4,12,7,0.85)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        backdropFilter: 'blur(4px)',
      }} />

      {/* Panel — slides in from right */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 'min(680px, 100vw)',
        background: 'var(--lb-card)',
        borderLeft: '1px solid var(--lb-gold-20)',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.65s cubic-bezier(0.22,1,0.36,1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '28px 40px', borderBottom: '1px solid var(--lb-gold-15)',
          position: 'sticky', top: 0, background: 'var(--lb-card)', zIndex: 1,
        }}>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: 'var(--lb-gold)', textTransform: 'uppercase', margin: '0 0 4px' }}>Le Bon</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, fontWeight: 400, color: 'var(--lb-text)', margin: 0 }}>
              Thực Đơn <em style={{ fontStyle: 'italic', color: 'var(--lb-gold)' }}>Đặc Sắc</em>
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--lb-gold-30)', cursor: 'pointer',
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lb-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lb-gold-30)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="1" y1="1" x2="13" y2="13" stroke="var(--lb-gold)" strokeWidth="1.5" />
              <line x1="13" y1="1" x2="1" y2="13" stroke="var(--lb-gold)" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Dishes */}
        <div style={{ padding: '32px 40px', flex: 1 }}>
          {SIGNATURE_DISHES.map((dish, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr', gap: 20,
              padding: '24px 0', borderBottom: '1px solid var(--lb-gold-10)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateX(20px)',
              transition: `opacity 0.6s ease ${200 + i * 80}ms, transform 0.6s ease ${200 + i * 80}ms`,
            }}>
              <div style={{ position: 'relative', height: 80, overflow: 'hidden', flexShrink: 0 }}>
                <NextImage src={dish.img} alt={dish.name} fill style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,30,16,0.2)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 12, fontStyle: 'italic', color: 'var(--lb-gold-60)', margin: '0 0 3px', letterSpacing: 0.5 }}>{dish.french}</p>
                    <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 19, fontWeight: 500, color: 'var(--lb-text)', margin: 0 }}>{dish.name}</h3>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-montserrat)', fontSize: 8, fontWeight: 600,
                    letterSpacing: 1.5, color: 'var(--lb-surface)', background: 'var(--lb-gold)',
                    padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0,
                    textTransform: 'uppercase',
                  }}>{dish.tag}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 14, color: 'color-mix(in srgb, var(--lb-text), transparent 50%)', lineHeight: 1.7, margin: '6px 0 10px' }}>{dish.desc}</p>
                <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, fontWeight: 600, color: 'var(--lb-gold)' }}>{dish.price}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          padding: '28px 40px', borderTop: '1px solid var(--lb-gold-15)',
          background: 'var(--lb-card)', position: 'sticky', bottom: 0,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <button onClick={() => { onClose(); onReserve(); }} style={{
            flex: 1, fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
            letterSpacing: 3, textTransform: 'uppercase',
            background: 'var(--lb-gold)', border: 'none', color: 'var(--lb-surface)',
            padding: '16px', cursor: 'pointer', transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--lb-gold-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--lb-gold)'; }}
          >Đặt Bàn Ngay</button>
          <button onClick={onClose} style={{
            fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
            letterSpacing: 2, textTransform: 'uppercase',
            background: 'transparent', border: '1px solid var(--lb-gold-30)',
            color: 'color-mix(in srgb, var(--lb-text), transparent 40%)', padding: '16px 24px', cursor: 'pointer', transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lb-gold)'; e.currentTarget.style.color = 'var(--lb-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lb-gold-30)'; e.currentTarget.style.color = 'color-mix(in srgb, var(--lb-text), transparent 40%)'; }}
          >Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" style={{ background: 'var(--lb-surface)', padding: '110px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="lb-about-grid">
        <Reveal dir="left">
          <div style={{ position: 'relative', height: 520 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '72%', height: '75%', overflow: 'hidden' }}>
              <NextImage src="/images/restaurant/warm_restaurant.webp" alt="Le Bon interior" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '55%', height: '55%', overflow: 'hidden', border: '4px solid var(--lb-surface)' }}>
              <NextImage src="/images/restaurant/bush_restaurant.webp" alt="Le Bon ambiance" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 40, left: -20, background: 'var(--lb-gold)', padding: '20px 28px', zIndex: 2 }}>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 38, fontWeight: 700, color: 'var(--lb-surface)', margin: 0, lineHeight: 1 }}>10+</p>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 2, color: 'var(--lb-surface)', margin: '5px 0 0', textTransform: 'uppercase' }}>Năm Kinh Nghiệm</p>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal dir="up" delay={0}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: 'var(--lb-gold)', textTransform: 'uppercase', marginBottom: 16 }}>Câu Chuyện Của Chúng Tôi</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 400, color: 'var(--lb-text)', lineHeight: 1.2, marginBottom: 24 }}>
              Nghệ Thuật Ẩm Thực<br /><em style={{ fontStyle: 'italic', color: 'var(--lb-gold)' }}>Pháp Tại Đà Nẵng</em>
            </h2>
            <GoldDivider />
          </Reveal>
          <Reveal dir="up" delay={120}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, color: 'color-mix(in srgb, var(--lb-text), transparent 28%)', lineHeight: 1.9, marginTop: 28, marginBottom: 18 }}>
              Le Bon ra đời từ tình yêu với ẩm thực Pháp cổ điển — nơi mỗi miếng thịt được nướng đúng nhiệt độ, mỗi loại sốt được nấu từ stock tự nhiên, và mỗi bữa ăn là một hành trình cảm xúc.
            </p>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, color: 'color-mix(in srgb, var(--lb-text), transparent 45%)', lineHeight: 1.9, marginBottom: 36 }}>
              Tọa lạc tại 101 Huỳnh Tấn Phát, Đà Nẵng — chúng tôi mang đến không gian bistro Pháp ấm cúng, nơi thời gian chậm lại và hương vị lên tiếng.
            </p>
          </Reveal>
          <Reveal dir="up" delay={200}>
            <div style={{ display: 'flex', gap: 44 }}>
              {[['80+', 'Nhãn Vang'], ['15+', 'Món Signature'], ['5 Sao', 'Đánh Giá']].map(([num, label]) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 40, fontWeight: 600, color: 'var(--lb-gold)', margin: 0, lineHeight: 1 }}>{num}</p>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 2, color: 'color-mix(in srgb, var(--lb-text), transparent 55%)', margin: '7px 0 0', textTransform: 'uppercase' }}>{label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Experience ───────────────────────────────────────────────────────────────
function ExperienceSection() {
  return (
    <section id="experience" style={{ background: 'var(--lb-text)', padding: '110px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal dir="up">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: 'var(--lb-gold)', textTransform: 'uppercase', marginBottom: 16 }}>Tại Sao Chọn Le Bon</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 400, color: 'var(--lb-surface)', marginBottom: 20 }}>
              Trải Nghiệm <em style={{ fontStyle: 'italic' }}>Khác Biệt</em>
            </h2>
            <GoldDivider />
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
          {EXPERIENCES.map((exp, i) => (
            <Reveal key={i} dir="up" delay={i * 100}>
              <div style={{
                background: i % 2 === 0 ? 'var(--lb-surface)' : 'var(--lb-surface-alt)',
                padding: '52px 36px', textAlign: 'center',
                transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                cursor: 'default', height: '100%',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 300, color: 'var(--lb-gold-30)', marginBottom: 20, letterSpacing: 2 }}>{exp.roman}</p>
                <div style={{ width: 32, height: 1, background: 'var(--lb-gold)', margin: '0 auto 24px', opacity: 0.5 }} />
                <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 500, color: 'var(--lb-gold)', marginBottom: 14 }}>{exp.title}</h3>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, color: 'color-mix(in srgb, var(--lb-text), transparent 40%)', lineHeight: 1.85, margin: 0 }}>{exp.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Menu Preview Section ─────────────────────────────────────────────────────
function MenuPreviewSection({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <section id="menu" style={{ background: 'var(--lb-surface)', padding: '110px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal dir="up">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: 'var(--lb-gold)', textTransform: 'uppercase', marginBottom: 16 }}>Thực Đơn Đặc Sắc</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 400, color: 'var(--lb-text)', marginBottom: 20 }}>
              Những Món <em style={{ fontStyle: 'italic', color: 'var(--lb-gold)' }}>Tiêu Biểu</em>
            </h2>
            <GoldDivider />
          </div>
        </Reveal>

        {/* Featured 3 dishes horizontal */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }} className="lb-menu-grid">
          {SIGNATURE_DISHES.slice(0, 3).map((dish, i) => (
            <Reveal key={i} dir="up" delay={i * 120}>
              <div style={{
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
                  <NextImage src={dish.img} alt={dish.name} fill style={{
                    objectFit: 'cover',
                    transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
                  }}
                    className="lb-dish-img"
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,28,16,0.9) 0%, rgba(10,28,16,0.1) 55%)' }} />
                  <div style={{ position: 'absolute', top: 14, right: 14, background: 'var(--lb-gold)', padding: '3px 10px' }}>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, fontWeight: 600, letterSpacing: 1.5, color: 'var(--lb-surface)', textTransform: 'uppercase' }}>{dish.tag}</span>
                  </div>
                </div>
                <div style={{ padding: '22px 24px 28px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lb-gold-10)', borderTop: 'none' }}>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 12, fontStyle: 'italic', color: 'var(--lb-gold-60)', margin: '0 0 5px', letterSpacing: 0.5 }}>{dish.french}</p>
                  <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 500, color: 'var(--lb-text)', margin: '0 0 10px' }}>{dish.name}</h3>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 14, color: 'color-mix(in srgb, var(--lb-text), transparent 50%)', lineHeight: 1.7, margin: '0 0 16px' }}>{dish.desc}</p>
                  <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 600, color: 'var(--lb-gold)' }}>{dish.price}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal dir="up" delay={360}>
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 17, fontStyle: 'italic', color: 'color-mix(in srgb, var(--lb-text), transparent 50%)', marginBottom: 28 }}>
              Và còn nhiều hơn thế — {SIGNATURE_DISHES.length} món đặc sắc đang chờ bạn khám phá
            </p>
            <button onClick={onMenuOpen} style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
              letterSpacing: 3, textTransform: 'uppercase',
              background: 'transparent', border: '1px solid var(--lb-gold)',
              color: 'var(--lb-gold)', padding: '15px 48px', cursor: 'pointer', transition: 'all 0.35s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--lb-gold)'; e.currentTarget.style.color = 'var(--lb-surface)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--lb-gold)'; }}
            >Xem Toàn Bộ Thực Đơn</button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
function GallerySection() {
  return (
    <section id="gallery" style={{ background: 'var(--lb-text)', padding: '110px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal dir="up">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: 'var(--lb-gold)', textTransform: 'uppercase', marginBottom: 16 }}>Không Gian</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 400, color: 'var(--lb-surface)', marginBottom: 20 }}>
              Thư Viện <em style={{ fontStyle: 'italic' }}>Hình Ảnh</em>
            </h2>
            <GoldDivider />
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '280px 280px', gap: 4 }} className="lb-gallery-grid">
          {GALLERY.map((src, i) => (
            <Reveal key={i} dir={i === 0 ? 'left' : 'up'} delay={i * 80}>
              <div style={{
                position: 'relative', overflow: 'hidden', height: '100%',
                gridRow: i === 0 ? 'span 2' : 'span 1',
              }} className={i === 0 ? 'lb-gallery-main' : ''}>
                <NextImage src={src} alt={`Le Bon ${i + 1}`} fill
                  style={{ objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)' }}
                  className="lb-gallery-img"
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(10,28,16,0)',
                  transition: 'background 0.4s ease',
                }} className="lb-gallery-overlay" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Reservation Banner ───────────────────────────────────────────────────────
function ReservationBanner({ onMenuOpen, onReserve }: { onMenuOpen: () => void; onReserve: () => void }) {
  return (
    <section style={{ position: 'relative', padding: '110px 24px', overflow: 'hidden', background: 'var(--lb-surface-alt)' }}>
      {/* Subtle diagonal lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(45deg, var(--lb-gold) 0, var(--lb-gold) 1px, transparent 0, transparent 50%)',
        backgroundSize: '24px 24px',
      }} />
      {/* Gold line top */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(to right, transparent, var(--lb-gold), transparent)' }} />

      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Reveal dir="up">
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: 'var(--lb-gold)', textTransform: 'uppercase', marginBottom: 20 }}>Đặt Bàn</p>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 300, color: 'var(--lb-text)', lineHeight: 1.2, marginBottom: 20 }}>
            Dành Riêng Một Buổi Tối<br /><em style={{ fontStyle: 'italic', color: 'var(--lb-gold)' }}>Đáng Nhớ</em>
          </h2>
          <GoldDivider />
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, color: 'color-mix(in srgb, var(--lb-text), transparent 40%)', lineHeight: 1.85, margin: '28px 0 16px' }}>
            Chúng tôi mở cửa từ Thứ Ba đến Chủ Nhật, 11:00 – 22:00.
          </p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, fontStyle: 'italic', color: 'color-mix(in srgb, var(--lb-text), transparent 60%)', marginBottom: 44 }}>
            Khuyến khích xem thực đơn trước khi đặt bàn để có trải nghiệm tốt nhất.
          </p>
        </Reveal>

        <Reveal dir="up" delay={120}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <button onClick={onMenuOpen} style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
              letterSpacing: 2.5, textTransform: 'uppercase',
              background: 'transparent', border: '1px solid var(--lb-gold-45)',
              color: 'color-mix(in srgb, var(--lb-text), transparent 25%)', padding: '15px 36px', cursor: 'pointer', transition: 'all 0.35s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lb-gold)'; e.currentTarget.style.color = 'var(--lb-gold)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lb-gold-45)'; e.currentTarget.style.color = 'color-mix(in srgb, var(--lb-text), transparent 25%)'; }}
            >Xem Thực Đơn</button>

            <button onClick={onReserve} style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
              letterSpacing: 2.5, textTransform: 'uppercase',
              background: 'var(--lb-gold)', border: 'none', color: 'var(--lb-surface)',
              padding: '15px 44px', cursor: 'pointer', transition: 'all 0.35s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--lb-gold-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--lb-gold)'; e.currentTarget.style.transform = 'none'; }}
            >Đặt Bàn Ngay</button>
          </div>
        </Reveal>

        <Reveal dir="up" delay={200}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 52, flexWrap: 'wrap' }}>
            {[
              { label: 'Địa Chỉ', value: '101 Huỳnh Tấn Phát, Đà Nẵng' },
              { label: 'Hotline', value: '0933 20 99 91' },
              { label: 'Website', value: 'www.lebonsteak.com' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 3, color: 'var(--lb-gold)', textTransform: 'uppercase', margin: '0 0 6px' }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 15, color: 'color-mix(in srgb, var(--lb-text), transparent 50%)', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Gold line bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(to right, transparent, var(--lb-gold), transparent)' }} />
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function FooterSection() {
  return (
    <footer id="contact" style={{ background: '#060e08', padding: '64px 24px 32px', borderTop: '1px solid var(--lb-gold-15)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 60, marginBottom: 52 }} className="lb-footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <NextImage src="/images/restaurant/lebon-logo.png" alt="Le Bon" width={34} height={34}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 19, fontWeight: 600, color: 'var(--lb-text)', letterSpacing: 4 }}>LE BON</span>
            </div>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, fontStyle: 'italic', color: 'color-mix(in srgb, var(--lb-text), transparent 62%)', lineHeight: 1.85, maxWidth: 280 }}>
              Steak & Wine · French Cuisine<br />Xa hoa kiểu Pháp, định nghĩa lại sự thanh lịch.
            </p>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 3, color: 'var(--lb-gold)', textTransform: 'uppercase', marginBottom: 20 }}>Khám Phá</p>
            {['Thực Đơn', 'Đặt Bàn', 'Về Chúng Tôi', 'Thư Viện'].map(l => (
              <a key={l} href="#" style={{
                display: 'block', fontFamily: 'var(--font-cormorant)', fontSize: 16,
                color: 'color-mix(in srgb, var(--lb-text), transparent 55%)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--lb-gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'color-mix(in srgb, var(--lb-text), transparent 55%)'; }}
              >{l}</a>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 3, color: 'var(--lb-gold)', textTransform: 'uppercase', marginBottom: 20 }}>Liên Hệ</p>
            {['101 Huỳnh Tấn Phát', 'Đà Nẵng, Việt Nam', '0933 20 99 91', 'www.lebonsteak.com'].map(l => (
              <p key={l} style={{ fontFamily: 'var(--font-cormorant)', fontSize: 15, color: 'color-mix(in srgb, var(--lb-text), transparent 55%)', marginBottom: 8 }}>{l}</p>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--lb-gold-10)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 2, color: 'color-mix(in srgb, var(--lb-text), transparent 80%)', margin: 0 }}>© 2024 LE BON STEAK & WINE. ALL RIGHTS RESERVED.</p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 14, fontStyle: 'italic', color: 'var(--lb-gold-30)', margin: 0 }}>French Opulence · Redefined Elegance</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Theme toggle button ──────────────────────────────────────────────────────
function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  // Dùng màu cố định vì fixed element thoát khỏi .lb-theme context
  const gold = '#c9a84c';
  const bg = dark ? '#0f2316' : '#ede8dc';
  const border = dark ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.4)';

  return (
    <button
      onClick={onToggle}
      title={dark ? 'Chuyển sang Light mode' : 'Chuyển sang Dark mode'}
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 500,
        width: 44, height: 44,
        background: bg,
        border: `1px solid ${border}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = gold; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = border; }}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeBonPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [dark, setDark] = useState(true);

  // Inject Le Bon branding ngay khi mount — không cần chờ TenantContext
  useEffect(() => {
    injectTenantBranding(LEBON_BRANDING);
  }, []);

  // Sync data-theme với hệ thống globals.css
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleReserve = () => {
    setMenuOpen(false);
    setReservationOpen(true);
  };

  return (
    <div className={`${cormorant.variable} ${montserrat.variable} lb-theme`} data-theme={dark ? 'dark' : 'light'}>
      <style jsx global>{`
        :root {
          --font-cormorant: ${cormorant.style.fontFamily};
          --font-montserrat: ${montserrat.style.fontFamily};
        }
        @keyframes lb-scroll-pulse {
          0%, 100% { opacity: 0.6; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }
        .lb-dish-img:hover  { transform: scale(1.06) !important; }
        .lb-gallery-img:hover { transform: scale(1.05) !important; }
        @media (max-width: 900px) {
          .lb-about-grid   { grid-template-columns: 1fr !important; }
          .lb-menu-grid    { grid-template-columns: 1fr 1fr !important; }
          .lb-gallery-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto !important; }
          .lb-gallery-grid > div { grid-row: span 1 !important; height: 200px !important; }
          .lb-gallery-main { height: 200px !important; }
          .lb-footer-grid  { grid-template-columns: 1fr !important; gap: 32px !important; }
          .lb-desktop-nav  { display: none !important; }
          .lb-mobile-btn   { display: flex !important; }
        }
        @media (max-width: 600px) {
          .lb-menu-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <NavBar onMenuOpen={() => setMenuOpen(true)} onReserve={handleReserve} dark={dark} onToggleDark={() => setDark(d => !d)} />
      <HeroSection onMenuOpen={() => setMenuOpen(true)} />
      <AboutSection />
      <ExperienceSection />
      <MenuPreviewSection onMenuOpen={() => setMenuOpen(true)} />
      <GallerySection />
      <ReservationBanner onMenuOpen={() => setMenuOpen(true)} onReserve={handleReserve} />
      <FooterSection />

      <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} onReserve={handleReserve} />
      <LeBonReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
    </div>
  );
}
