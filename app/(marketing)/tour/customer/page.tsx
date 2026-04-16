'use client';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  EditOutlined,
  FileTextOutlined,
  GiftOutlined,
  MessageOutlined,
  QrcodeOutlined,
  RobotOutlined,
  StarOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Typography } from 'antd';
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const { Paragraph, Text } = Typography;

const PINK = '#EC4899';
const PL = 'rgba(236,72,153,0.12)';
const PB = 'rgba(236,72,153,0.25)';

/* ─── MagneticCard ──────────────────────────────────────────────── */
function MagneticCard({
  children,
  strength = 0.3,
  style,
}: {
  children: React.ReactNode;
  strength?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [8, -8]);
  const rotateY = useTransform(x, [-50, 50], [-8, 8]);

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ ...style, rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── WaveDivider ───────────────────────────────────────────────── */
function WaveDivider({ flip = false, color = 'var(--card)' }: { flip?: boolean; color?: string }) {
  return (
    <div style={{ position: 'relative', height: 80, overflow: 'hidden', marginTop: -1 }}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', transform: flip ? 'scaleY(-1)' : 'none' }}
      >
        <motion.path
          fill={color}
          animate={{
            d: [
              'M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z',
              'M0,40 C360,0 1080,80 1440,40 L1440,80 L0,80 Z',
              'M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}

/* ─── GlowSection ───────────────────────────────────────────────── */
function GlowSection({
  children,
  accentColor = PINK,
  bg = 'var(--bg-base)',
}: {
  children: React.ReactNode;
  accentColor?: string;
  bg?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.1'] });
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [60, 0, 0, -60]);
  const scale = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.95, 1, 1, 0.95]);

  const orb1x = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const orb2x = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden', background: bg }}>
      <motion.div
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          x: orb1x,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: -200,
          right: -200,
          x: orb2x,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}10 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <motion.div style={{ position: 'relative', zIndex: 1, opacity, y, scale }}>
        {children}
      </motion.div>
    </div>
  );
}

/* ─── WordReveal ────────────────────────────────────────────────── */
function WordReveal({
  text,
  style,
}: {
  text: string;
  style?: React.CSSProperties;
}) {
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

/* ─── CounterBadge ──────────────────────────────────────────────── */
function CounterBadge({
  value,
  label,
  color,
  suffix = '',
}: {
  value: number;
  label: string;
  color: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const t = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t) / 1200, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = Math.round(eased * value).toString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      style={{
        textAlign: 'center',
        padding: '20px 24px',
        borderRadius: 20,
        background: `${color}10`,
        border: `1.5px solid ${color}30`,
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 900, color }}>
        <span ref={ref}>0</span>{suffix}
      </div>
      <Text style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, display: 'block' }}>
        {label}
      </Text>
    </motion.div>
  );
}

/* ─── FeatureCard ───────────────────────────────────────────────── */
function FeatureCard({
  icon,
  title,
  desc,
  accent = PINK,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        padding: '28px 24px',
        borderRadius: 20,
        background: 'var(--card)',
        border: '1.5px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'default',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: `${accent}15`,
          border: `1px solid ${accent}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      <Text style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</Text>
      <Text style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>{desc}</Text>
    </div>
  );
}

/* ─── TierBadge ─────────────────────────────────────────────────── */
function TierBadge({
  name,
  color,
  discount,
  points,
  icon,
}: {
  name: string;
  color: string;
  discount: string;
  points: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: '24px 20px',
        borderRadius: 20,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        border: `1.5px solid ${color}35`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `${color}20`,
          border: `2px solid ${color}50`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          fontSize: 24,
        }}
      >
        {icon}
      </div>
      <Text style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{name}</Text>
      <div
        style={{
          background: color,
          color: 'white',
          borderRadius: 20,
          padding: '3px 12px',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {discount}
      </div>
      <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>{points}</Text>
    </motion.div>
  );
}

/* ─── AIChatMock ────────────────────────────────────────────────── */
function AIChatMock() {
  const { t } = useTranslation();
  const messages = [
    { from: 'user', text: t('tour.customer.ai_chat.messages.1') },
    {
      from: 'ai',
      text: t('tour.customer.ai_chat.messages.2'),
    },
    { from: 'user', text: t('tour.customer.ai_chat.messages.3') },
    {
      from: 'ai',
      text: t('tour.customer.ai_chat.messages.4'),
    },
  ];

  return (
    <div
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        border: `1.5px solid ${PB}`,
        background: 'var(--card)',
        boxShadow: '0 8px 40px rgba(236,72,153,0.1)',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          background: PL,
          borderBottom: `1px solid ${PB}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src="/images/ai/assistant.png"
            alt="AI"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div>
          <Text style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, display: 'block' }}>
            {t('tour.customer.ai_chat.title')}
          </Text>
          <Text style={{ color: PINK, fontSize: 11, fontWeight: 600 }}>{t('tour.customer.ai_chat.status')}</Text>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: 14,
                background: msg.from === 'user' ? PINK : 'var(--bg-base)',
                color: msg.from === 'user' ? 'white' : 'var(--text)',
                border: msg.from === 'ai' ? '1px solid var(--border)' : 'none',
                fontSize: 13,
                lineHeight: 1.6,
                borderBottomRightRadius: msg.from === 'user' ? 4 : 14,
                borderBottomLeftRadius: msg.from === 'ai' ? 4 : 14,
              }}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ display: 'flex', gap: 4, paddingLeft: 4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: PINK }}
            />
          ))}
        </motion.div>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 20,
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          {t('tour.customer.ai_chat.input_placeholder')}
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: PINK,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          <MessageOutlined />
        </div>
      </div>
    </div>
  );
}

/* ─── OrderReviewMock ───────────────────────────────────────────── */
function OrderReviewMock() {
  const { t } = useTranslation();
  const GL = PL;
  const GB = PB;

  const orderItems = [
    { name: t('tour.customer.order_review.items.pho_bo'), qty: 2, price: 85000, status: 'done' },
    { name: t('tour.customer.order_review.items.bun_cha'), qty: 1, price: 75000, status: 'done' },
    { name: t('tour.customer.order_review.items.tra_sen'), qty: 3, price: 45000, status: 'done' },
    { name: t('tour.customer.order_review.items.banh_flan'), qty: 2, price: 35000, status: 'pending' },
  ];
  const subtotal = orderItems.reduce((s, i) => s + i.qty * i.price, 0);
  const discount = Math.round(subtotal * 0.08);
  const total = subtotal - discount;
  const points = Math.floor(total / 1000);
  const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <div
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        border: `1.5px solid ${GB}`,
        background: 'var(--card)',
        boxShadow: `0 8px 40px ${PL}`,
        maxWidth: 420,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          background: GL,
          borderBottom: `1px solid ${GB}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: PINK,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 15,
            }}
          >
            <FileTextOutlined />
          </div>
          <div>
            <Text style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, display: 'block' }}>
              {t('tour.customer.order_review.header.title')}
            </Text>
            <Text style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t('tour.customer.order_review.header.item_count')}</Text>
          </div>
        </div>
        <div
          style={{
            background: GL,
            border: `1px solid ${GB}`,
            color: PINK,
            borderRadius: 8,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {t('tour.customer.order_review.header.member_badge')}
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {orderItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 10,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: item.status === 'done' ? GL : 'rgba(245,158,11,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: item.status === 'done' ? PINK : '#F59E0B',
                }}
              >
                {item.status === 'done' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              </div>
              <div>
                <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block' }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>x{item.qty}</Text>
              </div>
            </div>
            <Text style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              {fmt(item.qty * item.price)}
            </Text>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {[
          { label: t('tour.customer.order_review.summary.subtotal'), value: fmt(subtotal), muted: true },
          { label: t('tour.customer.order_review.summary.discount'), value: `-${fmt(discount)}`, color: PINK },
          { label: t('tour.customer.order_review.summary.total'), value: fmt(total), bold: true },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 12,
                color: row.muted ? 'var(--text-muted)' : 'var(--text)',
                fontWeight: row.bold ? 700 : 400,
              }}
            >
              {row.label}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: row.bold ? 800 : 600,
                color: row.color ?? (row.bold ? PINK : 'var(--text)'),
              }}
            >
              {row.value}
            </Text>
          </div>
        ))}

        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            marginTop: 6,
            padding: '8px 12px',
            borderRadius: 10,
            background: GL,
            border: `1px solid ${GB}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StarOutlined style={{ color: '#F59E0B', fontSize: 13 }} />
            <Text style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{t('tour.customer.order_review.points.label')}</Text>
          </div>
          <Text style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>+{points} {t('tour.customer.order_review.points.suffix')}</Text>
        </motion.div>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: PINK,
            color: 'white',
            borderRadius: 12,
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: `0 4px 16px ${PB}`,
          }}
        >
          {t('tour.customer.order_review.cta')}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function CustomerPage() {
  const { t } = useTranslation();
  const AMBER = '#F59E0B';

  return (
    <div style={{ background: 'var(--bg-base)' }}>

      {/* ── Section 1: QR Ordering ─────────────────────────────── */}
      <GlowSection accentColor={PINK} bg="var(--bg-base)">
        <div style={{ padding: '120px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <WordReveal
              text={t('tour.customer.section_1.title')}
              style={{
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 900,
                color: 'var(--text)',
                lineHeight: 1.15,
                justifyContent: 'center',
              }}
            />
          </div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <Paragraph
              style={{
                color: 'var(--text-muted)',
                fontSize: 16,
                maxWidth: 560,
                margin: '0 auto',
                lineHeight: 1.8,
              }}
            >
              {t('tour.customer.section_1.description')}
            </Paragraph>
          </motion.div>

          {/* Counter badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              maxWidth: 560,
              margin: '0 auto 56px',
            }}
          >
            <CounterBadge value={0} label={t('tour.customer.section_1.stats.wait_seconds')} color={PINK} />
            <CounterBadge value={100} label={t('tour.customer.section_1.stats.menu_items')} color={PINK} suffix="+" />
            <CounterBadge value={3} label={t('tour.customer.section_1.stats.order_steps')} color={PINK} />
          </div>

          {/* Feature cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {[
              {
                icon: <QrcodeOutlined />,
                title: t('tour.customer.section_1.cards.qr.title'),
                desc: t('tour.customer.section_1.cards.qr.description'),
              },
              {
                icon: <ThunderboltOutlined />,
                title: t('tour.customer.section_1.cards.realtime.title'),
                desc: t('tour.customer.section_1.cards.realtime.description'),
              },
              {
                icon: <StarOutlined />,
                title: t('tour.customer.section_1.cards.loyalty.title'),
                desc: t('tour.customer.section_1.cards.loyalty.description'),
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <MagneticCard strength={0.2}>
                  <FeatureCard icon={card.icon} title={card.title} desc={card.desc} />
                </MagneticCard>
              </motion.div>
            ))}
          </div>
        </div>
      </GlowSection>

      <WaveDivider color="var(--card)" />

      {/* ── Section 2: Membership Tiers ────────────────────────── */}
      <GlowSection accentColor={AMBER} bg="var(--card)">
        <div style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <WordReveal
              text={t('tour.customer.section_2.title')}
              style={{
                fontSize: 'clamp(26px, 4vw, 44px)',
                fontWeight: 900,
                color: 'var(--text)',
                lineHeight: 1.2,
                justifyContent: 'center',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <Paragraph
              style={{
                color: 'var(--text-muted)',
                fontSize: 15,
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.8,
              }}
            >
              {t('tour.customer.section_2.description')}
            </Paragraph>
          </motion.div>

          {/* Tier badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 48,
            }}
          >
            {[
              { name: t('tour.customer.section_2.tiers.bronze.name'), color: '#CD7F32', discount: t('tour.customer.section_2.tiers.bronze.discount'), points: t('tour.customer.section_2.tiers.bronze.points'), icon: <StarOutlined /> },
              { name: t('tour.customer.section_2.tiers.silver.name'), color: '#9CA3AF', discount: t('tour.customer.section_2.tiers.silver.discount'), points: t('tour.customer.section_2.tiers.silver.points'), icon: <TrophyOutlined /> },
              { name: t('tour.customer.section_2.tiers.gold.name'), color: '#F59E0B', discount: t('tour.customer.section_2.tiers.gold.discount'), points: t('tour.customer.section_2.tiers.gold.points'), icon: <CrownOutlined /> },
              { name: t('tour.customer.section_2.tiers.platinum.name'), color: '#8B5CF6', discount: t('tour.customer.section_2.tiers.platinum.discount'), points: t('tour.customer.section_2.tiers.platinum.points'), icon: <GiftOutlined /> },
            ].map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <MagneticCard strength={0.15}>
                  <TierBadge
                    name={tier.name}
                    color={tier.color}
                    discount={tier.discount}
                    points={tier.points}
                    icon={tier.icon}
                  />
                </MagneticCard>
              </motion.div>
            ))}
          </div>

          {/* Points flow bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            style={{
              padding: '24px 28px',
              borderRadius: 20,
              background: 'var(--bg-base)',
              border: '1.5px solid var(--border)',
            }}
          >
            <Text style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, display: 'block', marginBottom: 16 }}>
              {t('tour.customer.section_2.points_path_title')}
            </Text>
            <div style={{ position: 'relative', height: 8, borderRadius: 8, background: 'var(--border)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '65%' }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  borderRadius: 8,
                  background: `linear-gradient(90deg, #CD7F32, #9CA3AF, ${AMBER}, #8B5CF6)`,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {['0', '500', '1500', '5000+'].map((v, i) => (
                <Text key={i} style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v}</Text>
              ))}
            </div>
          </motion.div>
        </div>
      </GlowSection>

      <WaveDivider flip color="var(--bg-base)" />

      {/* ── Section 3: AI Chatbox ───────────────────────────────── */}
      <GlowSection accentColor={PINK} bg="var(--bg-base)">
        <div style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 48,
              alignItems: 'center',
            }}
          >
            {/* Left: AI Chat mock */}
            <MagneticCard strength={0.1}>
              <AIChatMock />
            </MagneticCard>

            {/* Right: Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.4 }}
                style={{ marginBottom: 16 }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 16px',
                    borderRadius: 40,
                    background: PL,
                    border: `1.5px solid ${PB}`,
                    color: PINK,
                    fontWeight: 700,
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  <RobotOutlined />
                  {t('tour.customer.section_3.tag')}
                </div>
              </motion.div>

              <WordReveal
                text={t('tour.customer.section_3.title')}
                style={{
                  fontSize: 'clamp(22px, 3vw, 36px)',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.25,
                  marginBottom: 16,
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Paragraph style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
                  {t('tour.customer.section_3.description')}
                </Paragraph>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <RobotOutlined />, text: t('tour.customer.section_3.bullets.preferences') },
                  { icon: <ThunderboltOutlined />, text: t('tour.customer.section_3.bullets.instant_reply') },
                  { icon: <StarOutlined />, text: t('tour.customer.section_3.bullets.personalization') },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.4 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: PL,
                        border: `1px solid ${PB}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: PINK,
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <Text style={{ color: 'var(--text)', fontSize: 14 }}>{item.text}</Text>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlowSection>

      <WaveDivider color="var(--card)" />

      {/* ── Section 4: Order Review ─────────────────────────────── */}
      <GlowSection accentColor={PINK} bg="var(--card)">
        <div style={{ padding: '80px 24px 120px', maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 48,
              alignItems: 'center',
            }}
          >
            {/* Left: Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.4 }}
                style={{ marginBottom: 16 }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 16px',
                    borderRadius: 40,
                    background: PL,
                    border: `1.5px solid ${PB}`,
                    color: PINK,
                    fontWeight: 700,
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  <FileTextOutlined />
                  {t('tour.customer.section_4.tag')}
                </div>
              </motion.div>

              <WordReveal
                text={t('tour.customer.section_4.title')}
                style={{
                  fontSize: 'clamp(22px, 3vw, 36px)',
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.25,
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Paragraph style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
                  {t('tour.customer.section_4.description')}
                </Paragraph>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <UnorderedListOutlined />, text: t('tour.customer.section_4.bullets.order_status') },
                  { icon: <EditOutlined />, text: t('tour.customer.section_4.bullets.edit_cancel') },
                  { icon: <CheckCircleOutlined />, text: t('tour.customer.section_4.bullets.bill_discount') },
                  { icon: <StarOutlined />, text: t('tour.customer.section_4.bullets.points_after_payment') },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.4 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: PL,
                        border: `1px solid ${PB}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: PINK,
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <Text style={{ color: 'var(--text)', fontSize: 14 }}>{item.text}</Text>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Order review mock */}
            <MagneticCard strength={0.1}>
              <OrderReviewMock />
            </MagneticCard>
          </div>
        </div>
      </GlowSection>

    </div>
  );
}
