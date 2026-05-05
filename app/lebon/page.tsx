'use client';

import { LeBonReservationModal } from '@/components/lebon/LeBonReservationModal';
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
function Ornament({ color = '#c9a84c', size = 14 }: { color?: string; size?: number }) {
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
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
      <Ornament />
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
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
function NavBar({ onMenuOpen, onReserve }: { onMenuOpen: () => void; onReserve: () => void }) {
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
      borderBottom: scrolled ? '1px solid rgba(201,168,76,0.18)' : 'none',
      transition: 'all 0.5s ease',
      padding: '0 40px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <a href="#hero" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <NextImage src="/images/restaurant/lebon-logo.png" alt="Le Bon" width={40} height={40}
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 600, color: '#f5f0e8', letterSpacing: 4 }}>LE BON</span>
        </a>

        {/* Desktop */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }} className="lb-desktop-nav">
          {links.map(l => (
            l.action
              ? <button key={l.label} onClick={l.action} style={{
                  fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
                  color: 'rgba(245,240,232,0.8)', letterSpacing: 2.5, background: 'none',
                  border: 'none', cursor: 'pointer', textTransform: 'uppercase', padding: 0,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c9a84c')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.8)')}
              >{l.label}</button>
              : <a key={l.label} href={l.href} style={{
                  fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
                  color: 'rgba(245,240,232,0.8)', letterSpacing: 2.5, textDecoration: 'none',
                  textTransform: 'uppercase', transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c9a84c')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.8)')}
              >{l.label}</a>
          ))}
          <button onClick={onReserve} style={{
            fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
            letterSpacing: 2.5, textTransform: 'uppercase',
            background: 'transparent', border: '1px solid #c9a84c',
            color: '#c9a84c', padding: '10px 26px', cursor: 'pointer', transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.color = '#0f2316'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c9a84c'; }}
          >Đặt Bàn</button>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMobileOpen(v => !v)} className="lb-mobile-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none', flexDirection: 'column', gap: 5, padding: 4 }}>
          {[0, 1, 2].map(i => <span key={i} style={{ display: 'block', width: 22, height: 1.5, background: '#f5f0e8' }} />)}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ background: 'rgba(12,28,18,0.98)', padding: '16px 40px 28px', borderTop: '1px solid rgba(201,168,76,0.15)' }}>
          {links.map(l => (
            l.action
              ? <button key={l.label} onClick={() => { setMobileOpen(false); l.action!(); }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  fontFamily: 'var(--font-montserrat)', fontSize: 11, color: 'rgba(245,240,232,0.8)',
                  letterSpacing: 2, background: 'none', border: 'none', cursor: 'pointer',
                  textTransform: 'uppercase', padding: '12px 0',
                  borderBottom: '1px solid rgba(201,168,76,0.08)',
                }}>{l.label}</button>
              : <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} style={{
                  display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: 11,
                  color: 'rgba(245,240,232,0.8)', letterSpacing: 2, textDecoration: 'none',
                  textTransform: 'uppercase', padding: '12px 0',
                  borderBottom: '1px solid rgba(201,168,76,0.08)',
                }}>{l.label}</a>
          ))}
          <button onClick={() => { setMobileOpen(false); onReserve(); }} style={{
            marginTop: 20, width: '100%', fontFamily: 'var(--font-montserrat)', fontSize: 11,
            fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
            background: '#c9a84c', border: 'none', color: '#0f2316', padding: '13px', cursor: 'pointer',
          }}>Đặt Bàn Ngay</button>
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
      <NextImage src="/images/restaurant/banner-lebon_cleanup.png" alt="Le Bon" fill priority
        style={{ objectFit: 'cover', objectPosition: 'center', scale: loaded ? '1' : '1.04', transition: 'scale 1.8s cubic-bezier(0.22,1,0.36,1)' }} />

      {/* Base vignette — matches #0f2316 layout color */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,35,22,0.42) 0%, rgba(15,35,22,0.08) 50%, rgba(15,35,22,0.55) 100%)' }} />

      {/* Directional fade — soft feather into #0f2316 */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(15,35,22,0.0) 20%, rgba(15,35,22,0.28) 44%, rgba(15,35,22,0.60) 62%, rgba(15,35,22,0.70) 100%)' }} />

      {/* Full-width corner ornaments */}
      {([
        { top: 80, left: 48, borderTop: '1px solid rgba(201,168,76,0.35)', borderLeft: '1px solid rgba(201,168,76,0.35)' },
        { top: 80, right: 48, borderTop: '1px solid rgba(201,168,76,0.35)', borderRight: '1px solid rgba(201,168,76,0.35)' },
        { bottom: 64, left: 48, borderBottom: '1px solid rgba(201,168,76,0.35)', borderLeft: '1px solid rgba(201,168,76,0.35)' },
        { bottom: 64, right: 48, borderBottom: '1px solid rgba(201,168,76,0.35)', borderRight: '1px solid rgba(201,168,76,0.35)' },
      ] as React.CSSProperties[]).map((style, i) => (
        <div key={i} style={{
          position: 'absolute', width: 64, height: 64,
          opacity: loaded ? 1 : 0,
          transition: `opacity 1.4s ease ${700 + i * 120}ms`,
          ...style,
        }} />
      ))}

      {/* Thin gold vertical accent line */}
      <div style={{
        position: 'absolute', top: '18%', bottom: '18%', left: '53%',
        width: 1,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.5) 25%, rgba(201,168,76,0.5) 75%, transparent 100%)',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1.8s ease 1000ms',
      }} />

      {/* ── Right panel content ── */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '47%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '0 clamp(24px, 5vw, 72px)',
      }}>

        {/* Framed card — glass with gold border, #0f2316 toned */}
        <div style={{
          position: 'relative',
          width: '100%', maxWidth: 420,
          padding: 'clamp(32px, 4vw, 52px) clamp(28px, 3.5vw, 48px)',
          background: 'rgba(15,35,22,0.55)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
          border: '1px solid rgba(201,168,76,0.30)',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.10) inset, 0 32px 80px rgba(15,35,22,0.5)',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'none' : 'translateY(24px)',
          transition: 'opacity 1.2s ease 150ms, transform 1.2s cubic-bezier(0.22,1,0.36,1) 150ms',
        }}>

          {/* Inner corner accents */}
          {[
            { top: -1, left: -1, borderTop: '2px solid rgba(201,168,76,0.7)', borderLeft: '2px solid rgba(201,168,76,0.7)' },
            { top: -1, right: -1, borderTop: '2px solid rgba(201,168,76,0.7)', borderRight: '2px solid rgba(201,168,76,0.7)' },
            { bottom: -1, left: -1, borderBottom: '2px solid rgba(201,168,76,0.7)', borderLeft: '2px solid rgba(201,168,76,0.7)' },
            { bottom: -1, right: -1, borderBottom: '2px solid rgba(201,168,76,0.7)', borderRight: '2px solid rgba(201,168,76,0.7)' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
          ))}

          {/* Est. row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24,
            opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(10px)',
            transition: 'opacity 0.9s ease 400ms, transform 0.9s ease 400ms',
          }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.55))' }} />
            <span style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 8, fontWeight: 400,
              letterSpacing: 5, color: 'rgba(201,168,76,0.8)', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>Est. 2023 · Đà Nẵng</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.55))' }} />
          </div>

          {/* Logo */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 16,
            opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'scale(0.88)',
            transition: 'opacity 0.9s ease 520ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) 520ms',
          }}>
            <NextImage src="/images/restaurant/lebon-logo.png" alt="Le Bon" width={52} height={52}
              style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.88 }} />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(46px, 5.5vw, 82px)',
            fontWeight: 300, color: '#f5f0e8', letterSpacing: 14,
            margin: '0 0 2px', lineHeight: 1, textTransform: 'uppercase',
            textShadow: '0 1px 24px rgba(0,0,0,0.5)',
            opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(16px)',
            transition: 'opacity 1s ease 620ms, transform 1s ease 620ms',
          }}>Le Bon</h1>

          {/* Subtitle italic */}
          <p style={{
            fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(12px, 1.6vw, 18px)',
            fontStyle: 'italic', fontWeight: 300,
            color: 'rgba(245,240,232,0.58)', letterSpacing: 3,
            margin: '6px 0 20px',
            opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(12px)',
            transition: 'opacity 0.9s ease 720ms, transform 0.9s ease 720ms',
          }}>Steak &amp; Wine · French Cuisine</p>

          {/* Ornament divider */}
          <div style={{
            opacity: loaded ? 1 : 0, transition: 'opacity 0.9s ease 820ms',
            marginBottom: 20,
          }}>
            <GoldDivider />
          </div>

          {/* Tagline */}
          <p style={{
            fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(12px, 1.4vw, 16px)',
            fontStyle: 'italic', color: 'rgba(245,240,232,0.5)',
            lineHeight: 2, marginBottom: 36, letterSpacing: 0.5,
            opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(8px)',
            transition: 'opacity 0.9s ease 920ms, transform 0.9s ease 920ms',
          }}>
            Xa hoa kiểu Pháp, định nghĩa lại sự thanh lịch
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
            opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(10px)',
            transition: 'opacity 0.9s ease 1040ms, transform 0.9s ease 1040ms',
          }}>
            <button onClick={onMenuOpen} style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 8.5, fontWeight: 600,
              letterSpacing: 2.5, textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #c9a84c 0%, #e2c06a 50%, #c9a84c 100%)',
              backgroundSize: '200% 100%',
              border: 'none', color: '#0c1e10',
              padding: '13px 28px', cursor: 'pointer',
              transition: 'all 0.4s ease',
              boxShadow: '0 4px 24px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundPosition = '100% 0';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,168,76,0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundPosition = '0% 0';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.15)';
              }}
            >Khám Phá Thực Đơn</button>

            <a href="#about" style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 8.5, fontWeight: 500,
              letterSpacing: 2.5, textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid rgba(245,240,232,0.35)',
              color: 'rgba(245,240,232,0.8)',
              padding: '13px 28px', textDecoration: 'none',
              display: 'inline-block', transition: 'all 0.35s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(245,240,232,0.08)';
                e.currentTarget.style.borderColor = 'rgba(245,240,232,0.65)';
                e.currentTarget.style.color = '#f5f0e8';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(245,240,232,0.35)';
                e.currentTarget.style.color = 'rgba(245,240,232,0.8)';
                e.currentTarget.style.transform = 'none';
              }}
            >Về Chúng Tôi</a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        opacity: loaded ? 1 : 0, transition: 'opacity 1s ease 1300ms',
      }}>
        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 7.5, letterSpacing: 4, color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase' }}>Scroll</span>
        <div style={{
          width: 1, height: 44,
          background: 'linear-gradient(to bottom, rgba(201,168,76,0.55), transparent)',
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
        background: '#0a1e10',
        borderLeft: '1px solid rgba(201,168,76,0.2)',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.65s cubic-bezier(0.22,1,0.36,1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '28px 40px', borderBottom: '1px solid rgba(201,168,76,0.12)',
          position: 'sticky', top: 0, background: '#0a1e10', zIndex: 1,
        }}>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: '#c9a84c', textTransform: 'uppercase', margin: '0 0 4px' }}>Le Bon</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, fontWeight: 400, color: '#f5f0e8', margin: 0 }}>
              Thực Đơn <em style={{ fontStyle: 'italic', color: '#c9a84c' }}>Đặc Sắc</em>
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid rgba(201,168,76,0.3)', cursor: 'pointer',
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="1" y1="1" x2="13" y2="13" stroke="#c9a84c" strokeWidth="1.5" />
              <line x1="13" y1="1" x2="1" y2="13" stroke="#c9a84c" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Dishes */}
        <div style={{ padding: '32px 40px', flex: 1 }}>
          {SIGNATURE_DISHES.map((dish, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr', gap: 20,
              padding: '24px 0', borderBottom: '1px solid rgba(201,168,76,0.08)',
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
                    <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 12, fontStyle: 'italic', color: 'rgba(201,168,76,0.65)', margin: '0 0 3px', letterSpacing: 0.5 }}>{dish.french}</p>
                    <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 19, fontWeight: 500, color: '#f5f0e8', margin: 0 }}>{dish.name}</h3>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-montserrat)', fontSize: 8, fontWeight: 600,
                    letterSpacing: 1.5, color: '#0f2316', background: '#c9a84c',
                    padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0,
                    textTransform: 'uppercase',
                  }}>{dish.tag}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 14, color: 'rgba(245,240,232,0.5)', lineHeight: 1.7, margin: '6px 0 10px' }}>{dish.desc}</p>
                <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, fontWeight: 600, color: '#c9a84c' }}>{dish.price}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          padding: '28px 40px', borderTop: '1px solid rgba(201,168,76,0.12)',
          background: '#0a1e10', position: 'sticky', bottom: 0,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <button onClick={() => { onClose(); onReserve(); }} style={{
            flex: 1, fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
            letterSpacing: 3, textTransform: 'uppercase',
            background: '#c9a84c', border: 'none', color: '#0f2316',
            padding: '16px', cursor: 'pointer', transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#dbb85a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#c9a84c'; }}
          >Đặt Bàn Ngay</button>
          <button onClick={onClose} style={{
            fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
            letterSpacing: 2, textTransform: 'uppercase',
            background: 'transparent', border: '1px solid rgba(201,168,76,0.3)',
            color: 'rgba(245,240,232,0.6)', padding: '16px 24px', cursor: 'pointer', transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.color = '#c9a84c'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = 'rgba(245,240,232,0.6)'; }}
          >Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" style={{ background: '#0f2316', padding: '110px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="lb-about-grid">
        <Reveal dir="left">
          <div style={{ position: 'relative', height: 520 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '72%', height: '75%', overflow: 'hidden' }}>
              <NextImage src="/images/restaurant/warm_restaurant.webp" alt="Le Bon interior" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '55%', height: '55%', overflow: 'hidden', border: '4px solid #0f2316' }}>
              <NextImage src="/images/restaurant/bush_restaurant.webp" alt="Le Bon ambiance" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 40, left: -20, background: '#c9a84c', padding: '20px 28px', zIndex: 2 }}>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 38, fontWeight: 700, color: '#0f2316', margin: 0, lineHeight: 1 }}>10+</p>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 2, color: '#0f2316', margin: '5px 0 0', textTransform: 'uppercase' }}>Năm Kinh Nghiệm</p>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal dir="up" delay={0}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: '#c9a84c', textTransform: 'uppercase', marginBottom: 16 }}>Câu Chuyện Của Chúng Tôi</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 400, color: '#f5f0e8', lineHeight: 1.2, marginBottom: 24 }}>
              Nghệ Thuật Ẩm Thực<br /><em style={{ fontStyle: 'italic', color: '#c9a84c' }}>Pháp Tại Đà Nẵng</em>
            </h2>
            <GoldDivider />
          </Reveal>
          <Reveal dir="up" delay={120}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, color: 'rgba(245,240,232,0.72)', lineHeight: 1.9, marginTop: 28, marginBottom: 18 }}>
              Le Bon ra đời từ tình yêu với ẩm thực Pháp cổ điển — nơi mỗi miếng thịt được nướng đúng nhiệt độ, mỗi loại sốt được nấu từ stock tự nhiên, và mỗi bữa ăn là một hành trình cảm xúc.
            </p>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, color: 'rgba(245,240,232,0.55)', lineHeight: 1.9, marginBottom: 36 }}>
              Tọa lạc tại 101 Huỳnh Tấn Phát, Đà Nẵng — chúng tôi mang đến không gian bistro Pháp ấm cúng, nơi thời gian chậm lại và hương vị lên tiếng.
            </p>
          </Reveal>
          <Reveal dir="up" delay={200}>
            <div style={{ display: 'flex', gap: 44 }}>
              {[['80+', 'Nhãn Vang'], ['15+', 'Món Signature'], ['5 Sao', 'Đánh Giá']].map(([num, label]) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 40, fontWeight: 600, color: '#c9a84c', margin: 0, lineHeight: 1 }}>{num}</p>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 2, color: 'rgba(245,240,232,0.45)', margin: '7px 0 0', textTransform: 'uppercase' }}>{label}</p>
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
    <section id="experience" style={{ background: '#f5f0e8', padding: '110px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal dir="up">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: '#c9a84c', textTransform: 'uppercase', marginBottom: 16 }}>Tại Sao Chọn Le Bon</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 400, color: '#0f2316', marginBottom: 20 }}>
              Trải Nghiệm <em style={{ fontStyle: 'italic' }}>Khác Biệt</em>
            </h2>
            <GoldDivider />
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
          {EXPERIENCES.map((exp, i) => (
            <Reveal key={i} dir="up" delay={i * 100}>
              <div style={{
                background: i % 2 === 0 ? '#0f2316' : '#1a3a2a',
                padding: '52px 36px', textAlign: 'center',
                transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                cursor: 'default', height: '100%',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 32, fontWeight: 300, color: 'rgba(201,168,76,0.35)', marginBottom: 20, letterSpacing: 2 }}>{exp.roman}</p>
                <div style={{ width: 32, height: 1, background: '#c9a84c', margin: '0 auto 24px', opacity: 0.5 }} />
                <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 500, color: '#c9a84c', marginBottom: 14 }}>{exp.title}</h3>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, color: 'rgba(245,240,232,0.6)', lineHeight: 1.85, margin: 0 }}>{exp.desc}</p>
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
    <section id="menu" style={{ background: '#0f2316', padding: '110px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal dir="up">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: '#c9a84c', textTransform: 'uppercase', marginBottom: 16 }}>Thực Đơn Đặc Sắc</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 400, color: '#f5f0e8', marginBottom: 20 }}>
              Những Món <em style={{ fontStyle: 'italic', color: '#c9a84c' }}>Tiêu Biểu</em>
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
                  <div style={{ position: 'absolute', top: 14, right: 14, background: '#c9a84c', padding: '3px 10px' }}>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, fontWeight: 600, letterSpacing: 1.5, color: '#0f2316', textTransform: 'uppercase' }}>{dish.tag}</span>
                  </div>
                </div>
                <div style={{ padding: '22px 24px 28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.08)', borderTop: 'none' }}>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 12, fontStyle: 'italic', color: 'rgba(201,168,76,0.6)', margin: '0 0 5px', letterSpacing: 0.5 }}>{dish.french}</p>
                  <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 500, color: '#f5f0e8', margin: '0 0 10px' }}>{dish.name}</h3>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 14, color: 'rgba(245,240,232,0.5)', lineHeight: 1.7, margin: '0 0 16px' }}>{dish.desc}</p>
                  <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 600, color: '#c9a84c' }}>{dish.price}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal dir="up" delay={360}>
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 17, fontStyle: 'italic', color: 'rgba(245,240,232,0.5)', marginBottom: 28 }}>
              Và còn nhiều hơn thế — {SIGNATURE_DISHES.length} món đặc sắc đang chờ bạn khám phá
            </p>
            <button onClick={onMenuOpen} style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
              letterSpacing: 3, textTransform: 'uppercase',
              background: 'transparent', border: '1px solid #c9a84c',
              color: '#c9a84c', padding: '15px 48px', cursor: 'pointer', transition: 'all 0.35s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.color = '#0f2316'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c9a84c'; }}
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
    <section id="gallery" style={{ background: '#f5f0e8', padding: '110px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal dir="up">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: '#c9a84c', textTransform: 'uppercase', marginBottom: 16 }}>Không Gian</p>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 400, color: '#0f2316', marginBottom: 20 }}>
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
    <section style={{ position: 'relative', padding: '110px 24px', overflow: 'hidden', background: '#1a3a2a' }}>
      {/* Subtle diagonal lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)',
        backgroundSize: '24px 24px',
      }} />
      {/* Gold line top */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(to right, transparent, #c9a84c, transparent)' }} />

      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Reveal dir="up">
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, letterSpacing: 4, color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Đặt Bàn</p>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 300, color: '#f5f0e8', lineHeight: 1.2, marginBottom: 20 }}>
            Dành Riêng Một Buổi Tối<br /><em style={{ fontStyle: 'italic', color: '#c9a84c' }}>Đáng Nhớ</em>
          </h2>
          <GoldDivider />
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 18, color: 'rgba(245,240,232,0.6)', lineHeight: 1.85, margin: '28px 0 16px' }}>
            Chúng tôi mở cửa từ Thứ Ba đến Chủ Nhật, 11:00 – 22:00.
          </p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, fontStyle: 'italic', color: 'rgba(245,240,232,0.4)', marginBottom: 44 }}>
            Khuyến khích xem thực đơn trước khi đặt bàn để có trải nghiệm tốt nhất.
          </p>
        </Reveal>

        <Reveal dir="up" delay={120}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <button onClick={onMenuOpen} style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 500,
              letterSpacing: 2.5, textTransform: 'uppercase',
              background: 'transparent', border: '1px solid rgba(201,168,76,0.45)',
              color: 'rgba(245,240,232,0.75)', padding: '15px 36px', cursor: 'pointer', transition: 'all 0.35s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.color = '#c9a84c'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)'; e.currentTarget.style.color = 'rgba(245,240,232,0.75)'; }}
            >Xem Thực Đơn</button>

            <button onClick={onReserve} style={{
              fontFamily: 'var(--font-montserrat)', fontSize: 10, fontWeight: 600,
              letterSpacing: 2.5, textTransform: 'uppercase',
              background: '#c9a84c', border: 'none', color: '#0f2316',
              padding: '15px 44px', cursor: 'pointer', transition: 'all 0.35s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dbb85a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.transform = 'none'; }}
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
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 3, color: '#c9a84c', textTransform: 'uppercase', margin: '0 0 6px' }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 15, color: 'rgba(245,240,232,0.5)', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Gold line bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(to right, transparent, #c9a84c, transparent)' }} />
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function FooterSection() {
  return (
    <footer id="contact" style={{ background: '#060e08', padding: '64px 24px 32px', borderTop: '1px solid rgba(201,168,76,0.12)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 60, marginBottom: 52 }} className="lb-footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <NextImage src="/images/restaurant/lebon-logo.png" alt="Le Bon" width={34} height={34}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 19, fontWeight: 600, color: '#f5f0e8', letterSpacing: 4 }}>LE BON</span>
            </div>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, fontStyle: 'italic', color: 'rgba(245,240,232,0.38)', lineHeight: 1.85, maxWidth: 280 }}>
              Steak & Wine · French Cuisine<br />Xa hoa kiểu Pháp, định nghĩa lại sự thanh lịch.
            </p>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 3, color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Khám Phá</p>
            {['Thực Đơn', 'Đặt Bàn', 'Về Chúng Tôi', 'Thư Viện'].map(l => (
              <a key={l} href="#" style={{
                display: 'block', fontFamily: 'var(--font-cormorant)', fontSize: 16,
                color: 'rgba(245,240,232,0.45)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,240,232,0.45)'; }}
              >{l}</a>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 3, color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Liên Hệ</p>
            {['101 Huỳnh Tấn Phát', 'Đà Nẵng, Việt Nam', '0933 20 99 91', 'www.lebonsteak.com'].map(l => (
              <p key={l} style={{ fontFamily: 'var(--font-cormorant)', fontSize: 15, color: 'rgba(245,240,232,0.45)', marginBottom: 8 }}>{l}</p>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.08)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, letterSpacing: 2, color: 'rgba(245,240,232,0.2)', margin: 0 }}>© 2024 LE BON STEAK & WINE. ALL RIGHTS RESERVED.</p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 14, fontStyle: 'italic', color: 'rgba(201,168,76,0.35)', margin: 0 }}>French Opulence · Redefined Elegance</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeBonPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);

  const handleReserve = () => {
    setMenuOpen(false);
    setReservationOpen(true);
  };

  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`}>
      <style jsx global>{`
        :root {
          --font-cormorant: ${cormorant.style.fontFamily};
          --font-montserrat: ${montserrat.style.fontFamily};

          /* Le Bon design tokens */
          --lb-surface:   #0f2316;
          --lb-card:      #0a1e10;
          --lb-text:      #f5f0e8;
          --lb-gold:      #c9a84c;
          --lb-gold-hover:#dbb85a;
          --lb-gold-60:   rgba(201,168,76,0.6);
          --lb-gold-45:   rgba(201,168,76,0.45);
          --lb-gold-30:   rgba(201,168,76,0.3);
          --lb-gold-20:   rgba(201,168,76,0.2);
          --lb-gold-15:   rgba(201,168,76,0.15);
          --lb-gold-10:   rgba(201,168,76,0.1);
        }

        @keyframes lb-scroll-pulse {
          0%, 100% { opacity: 0.6; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }

        .lb-dish-img:hover { transform: scale(1.06) !important; }
        .lb-gallery-img:hover { transform: scale(1.05) !important; }
        .lb-gallery-overlay:hover { background: rgba(10,28,16,0.25) !important; }

        @media (max-width: 900px) {
          .lb-about-grid { grid-template-columns: 1fr !important; }
          .lb-menu-grid { grid-template-columns: 1fr 1fr !important; }
          .lb-gallery-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto !important; }
          .lb-gallery-grid > div { grid-row: span 1 !important; height: 200px !important; }
          .lb-gallery-main { height: 200px !important; }
          .lb-footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .lb-desktop-nav { display: none !important; }
          .lb-mobile-btn { display: flex !important; }
        }
        @media (max-width: 600px) {
          .lb-menu-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <NavBar onMenuOpen={() => setMenuOpen(true)} onReserve={handleReserve} />
      <HeroSection onMenuOpen={() => setMenuOpen(true)} />
      <AboutSection />
      <ExperienceSection />
      <MenuPreviewSection onMenuOpen={() => setMenuOpen(true)} />
      <GallerySection />
      <ReservationBanner onMenuOpen={() => setMenuOpen(true)} onReserve={handleReserve} />
      <FooterSection />

      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} onReserve={handleReserve} />

      <LeBonReservationModal
        open={reservationOpen}
        onClose={() => setReservationOpen(false)}
      />
    </div>
  );
}
