'use client';

import {
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  EditOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Typography } from 'antd';
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

const T = '#14B8A6';
const TL = 'rgba(20,184,166,0.12)';
const TB = 'rgba(20,184,166,0.25)';

/* ─── TypewriterText ─────────────────────────────────────────────── */
function TypewriterText({ text, inView, delay = 0 }: { text: string; inView: boolean; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!inView) { setDisplayed(''); setDone(false); return; }
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, 28);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [inView, text, delay]);
  return (
    <span>
      {displayed}
      {!done && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ color: T }}>|</motion.span>}
    </span>
  );
}

/* ─── TerminalBlock ──────────────────────────────────────────────── */
function TerminalBlock({
  command,
  title,
  children,
  inView,
  cmdDelay = 0,
}: {
  command: string;
  title: string;
  children: React.ReactNode;
  inView: boolean;
  cmdDelay?: number;
}) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${TB}`, background: '#0d1117', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}>
      <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {['#FF5F57', '#FFBD2E', '#28CA41'].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 13 }}>
        <div style={{ color: T, marginBottom: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>$ </span>
          <TypewriterText text={command} inView={inView} delay={cmdDelay} />
        </div>
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: cmdDelay / 1000 + command.length * 0.028 + 0.2, duration: 0.4 }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── StaffRow ───────────────────────────────────────────────────── */
function StaffRow({ name, role, online, delay, inView }: { name: string; role: string; online: boolean; delay: number; inView: boolean }) {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay, duration: 0.3 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: TL, border: `1px solid ${TB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T, fontSize: 13 }}>
          <UserOutlined />
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>{name}</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{role}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <motion.div animate={{ scale: online ? [1, 1.3, 1] : 1 }} transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: online ? '#10B981' : '#6B7280' }} />
        <span style={{ color: online ? '#10B981' : '#6B7280', fontSize: 10, fontWeight: 600 }}>
          {online ? t('tour.staff_ops.status.online') : t('tour.staff_ops.status.offline')}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── BulletItem ─────────────────────────────────────────────────── */
function BulletItem({ icon, text, delay, inView }: { icon: React.ReactNode; text: string; delay: number; inView: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay, duration: 0.4 }}
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: TL, border: `1px solid ${TB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T, fontSize: 15 }}>
        {icon}
      </span>
      <Text style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>{text}</Text>
    </motion.div>
  );
}

/* ─── Orb ────────────────────────────────────────────────────────── */
function Orb({ top, left, right, bottom }: { top?: number | string; left?: number | string; right?: number | string; bottom?: number | string }) {
  return (
    <div style={{ position: 'absolute', top, left, right, bottom, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
  );
}

/* ─── SectionTag ─────────────────────────────────────────────────── */
function SectionTag({ label }: { label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: TL, border: `1px solid ${TB}`, color: T, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 16 }}>
      {label}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function StaffOpsTourPage() {
  const { t } = useTranslation();
  const heroRef = useRef(null);
  const sec2Ref = useRef(null);
  const sec3Ref = useRef(null);
  const sec4Ref = useRef(null);
  const heroIn = useInView(heroRef, { once: false, amount: 0.3 });
  const sec2In = useInView(sec2Ref, { once: false, amount: 0.2 });
  const sec3In = useInView(sec3Ref, { once: false, amount: 0.2 });
  const sec4In = useInView(sec4Ref, { once: false, amount: 0.2 });

  return (
    <div style={{ background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* HERO */}
      <section ref={heroRef} style={{ position: 'relative', padding: '120px 24px 80px', textAlign: 'center' }}>
        <Orb top={-100} left={-100} />
        <Orb top={-100} right={-100} />
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15, duration: 0.6 }}>
            <Title level={1} style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.15, color: 'var(--text)', marginBottom: 20 }}>
              {t('tour.staff_ops.hero.title_prefix')} <span style={{ color: T }}>{t('tour.staff_ops.hero.title_highlight')}</span>
            </Title>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.28, duration: 0.6 }}>
            <Paragraph style={{ fontSize: 17, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.7 }}>
              {t('tour.staff_ops.hero.description')}
            </Paragraph>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 32 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.7 }}
            style={{ maxWidth: 560, margin: '0 auto', textAlign: 'left' }}>
            <TerminalBlock
              command="restx staff --list --status"
              title={t('tour.staff_ops.terminal.title')}
              inView={heroIn}
              cmdDelay={300}
            >
              <div style={{ marginTop: 4 }}>
                <StaffRow name={t('tour.staff_ops.hero.staff.an.name')} role={t('tour.staff_ops.hero.staff.an.role')} online delay={0.9} inView={heroIn} />
                <StaffRow name={t('tour.staff_ops.hero.staff.bich.name')} role={t('tour.staff_ops.hero.staff.bich.role')} online delay={1.1} inView={heroIn} />
                <StaffRow name={t('tour.staff_ops.hero.staff.duc.name')} role={t('tour.staff_ops.hero.staff.duc.role')} online={false} delay={1.3} inView={heroIn} />
              </div>
            </TerminalBlock>
          </motion.div>
        </div>
      </section>

      {/* SEC 2 — Tao & quan ly tai khoan */}
      <section ref={sec2Ref} style={{ position: 'relative', padding: '80px 24px', background: 'var(--card)' }}>
        <Orb bottom={-120} right={-80} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={sec2In ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <TerminalBlock command="restx staff --create --role=waiter" title={t('tour.staff_ops.terminal.title')} inView={sec2In} cmdDelay={200}>
              <div style={{ lineHeight: 1.9 }}>
                <div style={{ color: '#10B981' }}>{'> '}{t('tour.staff_ops.section_1.terminal.name_label')}: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{t('tour.staff_ops.hero.staff.an.name')}</span></div>
                <div style={{ color: '#10B981' }}>{'> '}{t('tour.staff_ops.section_1.terminal.email_label')}: <span style={{ color: 'rgba(255,255,255,0.7)' }}>an.nguyen@restx.vn</span></div>
                <div style={{ color: '#10B981' }}>{'> '}{t('tour.staff_ops.section_1.terminal.role_label')}: <span style={{ color: T }}>waiter</span></div>
                <div style={{ color: '#10B981' }}>{'> '}{t('tour.staff_ops.section_1.terminal.shift_label')}: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{t('tour.staff_ops.section_1.terminal.shift_value')}</span></div>
                <div style={{ marginTop: 10, color: T, fontWeight: 700 }}>{t('tour.staff_ops.section_1.terminal.success')}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>{t('tour.staff_ops.section_1.terminal.note')}</div>
              </div>
            </TerminalBlock>
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={sec2In ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
              <SectionTag label={t('tour.staff_ops.section_1.tag')} />
              <Title level={2} style={{ color: 'var(--text)', fontWeight: 800, fontSize: 'clamp(24px,3.5vw,36px)', marginBottom: 12 }}>
                {t('tour.staff_ops.section_1.title')}
              </Title>
              <Paragraph style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                {t('tour.staff_ops.section_1.description')}
              </Paragraph>
            </motion.div>
            <BulletItem icon={<UserAddOutlined />} text={t('tour.staff_ops.section_1.bullets.create_account')} delay={0.3} inView={sec2In} />
            <BulletItem icon={<TeamOutlined />} text={t('tour.staff_ops.section_1.bullets.assign_roles')} delay={0.45} inView={sec2In} />
            <BulletItem icon={<EditOutlined />} text={t('tour.staff_ops.section_1.bullets.edit_disable')} delay={0.6} inView={sec2In} />
          </div>
        </div>
      </section>

      {/* SEC 3 — Nghiep vu tai ban */}
      <section ref={sec3Ref} style={{ position: 'relative', padding: '80px 24px', background: 'var(--bg-base)' }}>
        <Orb top={-80} left={-80} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={sec3In ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
              <SectionTag label={t('tour.staff_ops.section_2.tag')} />
              <Title level={2} style={{ color: 'var(--text)', fontWeight: 800, fontSize: 'clamp(24px,3.5vw,36px)', marginBottom: 12 }}>
                {t('tour.staff_ops.section_2.title')}
              </Title>
              <Paragraph style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                {t('tour.staff_ops.section_2.description')}
              </Paragraph>
            </motion.div>
            <BulletItem icon={<CheckCircleOutlined />} text={t('tour.staff_ops.section_2.bullets.checkin')} delay={0.3} inView={sec3In} />
            <BulletItem icon={<PlusCircleOutlined />} text={t('tour.staff_ops.section_2.bullets.add_items')} delay={0.45} inView={sec3In} />
            <BulletItem icon={<CloseCircleOutlined />} text={t('tour.staff_ops.section_2.bullets.cancel_items')} delay={0.6} inView={sec3In} />
            <BulletItem icon={<EditOutlined />} text={t('tour.staff_ops.section_2.bullets.update_qty_note')} delay={0.75} inView={sec3In} />
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={sec3In ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <TerminalBlock command="restx order --table=A02 --action=update" title={t('tour.staff_ops.terminal.title')} inView={sec3In} cmdDelay={200}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8 }}>{t('tour.staff_ops.section_2.terminal.table_meta')}</div>
                {[
                  { name: t('tour.staff_ops.section_2.terminal.items.pho_bo'), qty: 2, price: '89.000', status: 'done' },
                  { name: t('tour.staff_ops.section_2.terminal.items.com_tam'), qty: 1, price: '75.000', status: 'done' },
                  { name: t('tour.staff_ops.section_2.terminal.items.nuoc_cam'), qty: 3, price: '35.000', status: 'pending' },
                  { name: t('tour.staff_ops.section_2.terminal.items.banh_mi'), qty: 2, price: '45.000', status: 'cancelled' },
                ].map((item, i) => (
                  <motion.div key={item.name} initial={{ opacity: 0, x: 10 }} animate={sec3In ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.8 + i * 0.15, duration: 0.3 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{item.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginLeft: 8 }}>x{item.qty}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{item.price}d</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: item.status === 'done' ? 'rgba(16,185,129,0.15)' : item.status === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)', color: item.status === 'done' ? '#10B981' : item.status === 'pending' ? '#FBBF24' : '#EF4444' }}>
                        {item.status === 'done'
                          ? t('tour.staff_ops.section_2.terminal.status.done')
                          : item.status === 'pending'
                            ? t('tour.staff_ops.section_2.terminal.status.pending')
                            : t('tour.staff_ops.section_2.terminal.status.cancelled')}
                      </span>
                    </div>
                  </motion.div>
                ))}
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{t('tour.staff_ops.section_2.terminal.total_label')}</span>
                  <span style={{ color: T, fontWeight: 700, fontSize: 13 }}>458.000d</span>
                </div>
              </div>
            </TerminalBlock>
          </motion.div>
        </div>
      </section>

      {/* SEC 4 — Thanh toan */}
      <section ref={sec4Ref} style={{ position: 'relative', padding: '80px 24px', background: 'var(--card)' }}>
        <Orb bottom={-100} left={-80} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={sec4In ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <TerminalBlock command="restx payment --table=A02 --method=transfer" title={t('tour.staff_ops.terminal.title')} inView={sec4In} cmdDelay={200}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 10 }}>{t('tour.staff_ops.section_3.terminal.invoice_title')}</div>
                {[
                  { label: t('tour.staff_ops.section_3.terminal.rows.subtotal'), value: '458.000d' },
                  { label: t('tour.staff_ops.section_3.terminal.rows.vat'), value: '36.640d' },
                  { label: t('tour.staff_ops.section_3.terminal.rows.discount'), value: '-20.000d' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{row.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 12px', borderBottom: `1px solid ${TB}` }}>
                  <span style={{ color: T, fontWeight: 700, fontSize: 13 }}>{t('tour.staff_ops.section_3.terminal.total_label')}</span>
                  <span style={{ color: T, fontWeight: 800, fontSize: 15 }}>474.640d</span>
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, border: `2px solid ${TB}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(20,184,166,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,8px)', gap: 2 }}>
                      {Array.from({ length: 25 }, (_, i) => (
                        <div key={i} style={{ width: 8, height: 8, background: [0,2,4,10,12,14,20,22,24].includes(i) ? T : 'rgba(20,184,166,0.2)', borderRadius: 1 }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 6 }}>{t('tour.staff_ops.section_3.terminal.method_label')}</div>
                    {[t('tour.staff_ops.section_3.terminal.methods.cash'), t('tour.staff_ops.section_3.terminal.methods.transfer')].map((m, i) => (
                      <motion.div key={m} initial={{ opacity: 0 }} animate={sec4In ? { opacity: 1 } : {}} transition={{ delay: 1.2 + i * 0.2 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginRight: 8, padding: '3px 10px', borderRadius: 6, background: i === 1 ? TL : 'rgba(255,255,255,0.06)', border: `1px solid ${i === 1 ? TB : 'rgba(255,255,255,0.1)'}`, color: i === 1 ? T : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>
                        {m}
                      </motion.div>
                    ))}
                    <div style={{ marginTop: 10, color: '#10B981', fontSize: 11, fontWeight: 700 }}>{t('tour.staff_ops.section_3.terminal.success')}</div>
                  </div>
                </div>
              </div>
            </TerminalBlock>
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={sec4In ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
              <SectionTag label={t('tour.staff_ops.section_3.tag')} />
              <Title level={2} style={{ color: 'var(--text)', fontWeight: 800, fontSize: 'clamp(24px,3.5vw,36px)', marginBottom: 12 }}>
                {t('tour.staff_ops.section_3.title')}
              </Title>
              <Paragraph style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                {t('tour.staff_ops.section_3.description')}
              </Paragraph>
            </motion.div>
            <BulletItem icon={<WalletOutlined />} text={t('tour.staff_ops.section_3.bullets.cash')} delay={0.3} inView={sec4In} />
            <BulletItem icon={<BankOutlined />} text={t('tour.staff_ops.section_3.bullets.transfer')} delay={0.45} inView={sec4In} />
            <BulletItem icon={<CreditCardOutlined />} text={t('tour.staff_ops.section_3.bullets.loyalty_points')} delay={0.6} inView={sec4In} />
          </div>
        </div>
      </section>

    </div>
  );
}

