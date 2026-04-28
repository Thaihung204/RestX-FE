'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
}

const initialForm = {
  date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
  time: '19:00',
  guests: 2,
  name: '',
  phone: '',
  email: '',
  requests: '',
};

const TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30',
];

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const getTodayLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().split('T')[0];
};

const getMaxDate = () => dayjs().add(1, 'month').format('YYYY-MM-DD');

const isFuture = (date: string, time: string) =>
  dayjs(`${date}T${time}:00`).isAfter(dayjs());

// ─── Inline styles (palette: lb-surface / lb-gold / lb-text) ─────────────────
const S = {
  label: {
    fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: 'var(--lb-gold-60)',
    display: 'block',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--lb-gold-20)',
    color: 'var(--lb-text)',
    fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: 'var(--lb-gold-60)',
  },
};

// ─── FocusInput wrapper ───────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={S.label}>{label}</span>
      {children}
    </div>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...S.input, ...(focused ? S.inputFocus : {}), ...props.style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...S.input, padding: '12px 16px', resize: 'none',
        ...(focused ? S.inputFocus : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Date grid ────────────────────────────────────────────────────────────────
function DateGrid({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const today = getTodayLocal();
  const max = getMaxDate();

  // Build 14 days from tomorrow
  const days: string[] = [];
  for (let i = 1; i <= 14; i++) {
    days.push(dayjs().add(i, 'day').format('YYYY-MM-DD'));
  }

  const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const MONTH_VI = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'];

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
      {days.map(d => {
        const dj = dayjs(d);
        const selected = d === value;
        const disabled = d < today || d > max;
        return (
          <button
            key={d}
            disabled={disabled}
            onClick={() => onChange(d)}
            style={{
              flexShrink: 0,
              width: 52,
              padding: '10px 0',
              background: selected ? 'var(--lb-gold)' : 'rgba(255,255,255,0.04)',
              border: selected ? 'none' : '1px solid var(--lb-gold-15)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.3 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
            onMouseEnter={e => { if (!selected && !disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-45)'; }}
            onMouseLeave={e => { if (!selected && !disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-15)'; }}
          >
            <span style={{
              fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
              fontSize: 8, letterSpacing: 1,
              color: selected ? 'var(--lb-surface)' : 'color-mix(in srgb, var(--lb-text), transparent 55%)',
              textTransform: 'uppercase',
            }}>{DAY_LABELS[dj.day()]}</span>
            <span style={{
              fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
              fontSize: 22, fontWeight: 600, lineHeight: 1,
              color: selected ? 'var(--lb-surface)' : 'var(--lb-text)',
            }}>{dj.format('D')}</span>
            <span style={{
              fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
              fontSize: 8,
              color: selected ? 'var(--lb-surface)' : 'color-mix(in srgb, var(--lb-text), transparent 65%)',
            }}>{MONTH_VI[dj.month()]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Time grid ────────────────────────────────────────────────────────────────
function TimeGrid({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {TIME_SLOTS.map(t => {
        const selected = t === value;
        return (
          <button key={t} onClick={() => onChange(t)} style={{
            padding: '9px 0',
            background: selected ? 'var(--lb-gold)' : 'rgba(255,255,255,0.04)',
            border: selected ? 'none' : '1px solid var(--lb-gold-15)',
            color: selected ? 'var(--lb-surface)' : 'color-mix(in srgb, var(--lb-text), transparent 25%)',
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
            fontSize: 15, fontWeight: selected ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-45)'; }}
            onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-15)'; }}
          >{t}</button>
        );
      })}
    </div>
  );
}

// ─── Guest selector ───────────────────────────────────────────────────────────
function GuestSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {GUEST_OPTIONS.map(n => {
        const selected = n === value;
        return (
          <button key={n} onClick={() => onChange(n)} style={{
            width: 44, height: 44,
            background: selected ? 'var(--lb-gold)' : 'rgba(255,255,255,0.04)',
            border: selected ? 'none' : '1px solid var(--lb-gold-15)',
            color: selected ? 'var(--lb-surface)' : 'color-mix(in srgb, var(--lb-text), transparent 25%)',
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
            fontSize: 17, fontWeight: selected ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-45)'; }}
            onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-15)'; }}
          >{n}</button>
        );
      })}
      <button onClick={() => onChange(Math.min(value + 1, 20))} style={{
        width: 44, height: 44,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--lb-gold-15)',
        color: 'color-mix(in srgb, var(--lb-text), transparent 40%)',
        fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
        fontSize: 20, cursor: 'pointer',
      }}>+</button>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          height: 1,
          width: i === step ? 28 : 14,
          background: i === step ? 'var(--lb-gold)' : 'var(--lb-gold-20)',
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  );
}

// ─── Gold divider ─────────────────────────────────────────────────────────────
function GoldLine() {
  return <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--lb-gold-30), transparent)', margin: '4px 0' }} />;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function LeBonReservationModal({ open, onClose }: Props) {
  const [form, setForm] = useState({ ...initialForm });
  const [step, setStep] = useState(0); // 0: date/time/guests, 1: contact, 2: success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Portal mount
  useState(() => { setMounted(true); });

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      document.body.style.overflow = '';
      const t = setTimeout(() => {
        setMounted(false);
        // reset
        setForm({ ...initialForm });
        setStep(0);
        setError(null);
        setConfirmationCode('');
        setCheckoutUrl(null);
        setPaymentDeadline(null);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Vui lòng điền họ tên và số điện thoại.');
      return;
    }
    if (!isFuture(form.date, form.time)) {
      setError('Vui lòng chọn thời gian trong tương lai.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { reservationService } = await import('@/lib/services/reservationService');
      const result = await reservationService.createReservation({
        tableIds: [],
        reservationDateTime: `${form.date}T${form.time}:00`,
        numberOfGuests: form.guests,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        specialRequests: form.requests.trim() || undefined,
      });

      const raw = result as any;
      const code =
        raw?.confirmationCode || raw?.ConfirmationCode ||
        (raw?.id ? raw.id.replace(/-/g, '').slice(0, 6).toUpperCase() : 'N/A');

      setConfirmationCode(code);
      setCheckoutUrl(raw?.checkoutUrl || raw?.CheckoutUrl || null);
      setPaymentDeadline(raw?.paymentDeadline || raw?.PaymentDeadline || null);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const STEP_TITLES = ['Chọn Thời Gian', 'Thông Tin Liên Hệ', 'Xác Nhận'];

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(4,12,7,0.88)',
        backdropFilter: 'blur(6px)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 560,
        background: 'var(--lb-card)',
        border: '1px solid var(--lb-gold-20)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 32px 20px',
          borderBottom: '1px solid var(--lb-gold-15)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
              fontSize: 9, letterSpacing: 4, color: 'var(--lb-gold)',
              textTransform: 'uppercase', margin: '0 0 6px',
            }}>Le Bon · Steak & Wine</p>
            <h2 style={{
              fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
              fontSize: 26, fontWeight: 400, color: 'var(--lb-text)', margin: '0 0 12px',
            }}>
              {step < 2
                ? <>Đặt Bàn <em style={{ fontStyle: 'italic', color: 'var(--lb-gold)' }}>Trực Tuyến</em></>
                : <>Đặt Bàn <em style={{ fontStyle: 'italic', color: 'var(--lb-gold)' }}>Thành Công</em></>
              }
            </h2>
            {step < 2 && <StepDots step={step} />}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--lb-gold-20)',
            width: 36, height: 36, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-20)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="var(--lb-gold)" strokeWidth="1.5"/>
              <line x1="11" y1="1" x2="1" y2="11" stroke="var(--lb-gold)" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Step 0: Date / Time / Guests ── */}
          {step === 0 && (
            <>
              <Field label="Ngày">
                <DateGrid value={form.date} onChange={d => setForm(p => ({ ...p, date: d }))} />
              </Field>

              <GoldLine />

              <Field label="Giờ Đến">
                <TimeGrid value={form.time} onChange={t => setForm(p => ({ ...p, time: t }))} />
              </Field>

              <GoldLine />

              <Field label="Số Khách">
                <GuestSelector value={form.guests} onChange={n => setForm(p => ({ ...p, guests: n }))} />
                {form.guests > 8 && (
                  <p style={{
                    fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
                    fontSize: 14, fontStyle: 'italic',
                    color: 'var(--lb-gold-60)', marginTop: 8,
                  }}>
                    Nhóm trên 8 người — chúng tôi sẽ liên hệ xác nhận bàn phù hợp.
                  </p>
                )}
              </Field>

              {/* Summary preview */}
              <div style={{
                padding: '14px 18px',
                background: 'var(--lb-gold-10)',
                border: '1px solid var(--lb-gold-15)',
                display: 'flex', gap: 24, flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Ngày', value: dayjs(form.date).format('DD/MM/YYYY') },
                  { label: 'Giờ', value: form.time },
                  { label: 'Khách', value: `${form.guests} người` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)', fontSize: 8, letterSpacing: 2, color: 'var(--lb-gold-60)', textTransform: 'uppercase', margin: '0 0 3px' }}>{label}</p>
                    <p style={{ fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)', fontSize: 17, color: 'var(--lb-text)', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Step 1: Contact ── */}
          {step === 1 && (
            <>
              {/* Summary bar */}
              <div style={{
                padding: '12px 18px',
                background: 'var(--lb-gold-10)',
                border: '1px solid var(--lb-gold-15)',
                display: 'flex', gap: 24, flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Ngày', value: dayjs(form.date).format('DD/MM/YYYY') },
                  { label: 'Giờ', value: form.time },
                  { label: 'Khách', value: `${form.guests} người` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)', fontSize: 8, letterSpacing: 2, color: 'var(--lb-gold-60)', textTransform: 'uppercase', margin: '0 0 3px' }}>{label}</p>
                    <p style={{ fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)', fontSize: 16, color: 'var(--lb-text)', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Họ và Tên *">
                  <StyledInput
                    type="text" placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </Field>
                <Field label="Số Điện Thoại *">
                  <StyledInput
                    type="tel" placeholder="0901 234 567"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Email">
                <StyledInput
                  type="email" placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </Field>

              <Field label="Yêu Cầu Đặc Biệt">
                <StyledTextarea
                  rows={3}
                  placeholder="Dị ứng thực phẩm, dịp đặc biệt, yêu cầu về chỗ ngồi..."
                  value={form.requests}
                  onChange={e => setForm(p => ({ ...p, requests: e.target.value }))}
                />
              </Field>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(220,80,60,0.1)',
                  border: '1px solid rgba(220,80,60,0.3)',
                  fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
                  fontSize: 15, color: '#e07060',
                }}>{error}</div>
              )}
            </>
          )}

          {/* ── Step 2: Success ── */}
          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              {/* Check mark */}
              <div style={{
                width: 64, height: 64, margin: '0 auto 24px',
                border: '1px solid var(--lb-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <polyline points="5,14 11,20 23,8" stroke="var(--lb-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <p style={{
                fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
                fontSize: 9, letterSpacing: 4, color: 'var(--lb-gold)',
                textTransform: 'uppercase', marginBottom: 12,
              }}>Đặt Bàn Thành Công</p>

              <h3 style={{
                fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
                fontSize: 28, fontWeight: 400, color: 'var(--lb-text)', marginBottom: 8,
              }}>
                Hẹn gặp bạn tại Le Bon
              </h3>

              <p style={{
                fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
                fontSize: 16, fontStyle: 'italic',
                color: 'color-mix(in srgb, var(--lb-text), transparent 45%)', marginBottom: 28,
              }}>
                {dayjs(form.date).format('dddd, DD/MM/YYYY')} lúc {form.time} · {form.guests} khách
              </p>

              <div style={{
                padding: '16px 24px', margin: '0 auto 28px',
                background: 'var(--lb-gold-10)',
                border: '1px solid var(--lb-gold-20)',
                display: 'inline-block',
              }}>
                <p style={{ fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)', fontSize: 8, letterSpacing: 3, color: 'var(--lb-gold-60)', textTransform: 'uppercase', margin: '0 0 6px' }}>Mã Xác Nhận</p>
                <p style={{ fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)', fontSize: 28, fontWeight: 600, color: 'var(--lb-gold)', margin: 0, letterSpacing: 4 }}>{confirmationCode}</p>
              </div>

              {checkoutUrl && (
                <div style={{ marginBottom: 16 }}>
                  <button onClick={() => { window.location.href = checkoutUrl!; }} style={{
                    width: '100%', padding: '14px',
                    background: 'var(--lb-gold)', border: 'none', color: 'var(--lb-surface)',
                    fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
                    fontSize: 10, fontWeight: 600, letterSpacing: 3,
                    textTransform: 'uppercase', cursor: 'pointer', marginBottom: 8,
                  }}>Thanh Toán Đặt Cọc</button>
                  {paymentDeadline && (
                    <p style={{
                      fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
                      fontSize: 13, fontStyle: 'italic',
                      color: 'rgba(220,80,60,0.8)', margin: 0,
                    }}>
                      Hạn thanh toán: {new Date(paymentDeadline).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              )}

              <p style={{
                fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
                fontSize: 15, color: 'color-mix(in srgb, var(--lb-text), transparent 60%)',
              }}>
                Chúng tôi sẽ liên hệ xác nhận qua số {form.phone}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid var(--lb-gold-15)',
          display: 'flex', gap: 10,
        }}>
          {step === 0 && (
            <>
              <button onClick={onClose} style={{
                flex: 1, padding: '14px',
                background: 'transparent', border: '1px solid var(--lb-gold-20)',
                color: 'color-mix(in srgb, var(--lb-text), transparent 50%)',
                fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
                fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-45)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--lb-gold)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-20)'; (e.currentTarget as HTMLButtonElement).style.color = 'color-mix(in srgb, var(--lb-text), transparent 50%)'; }}
              >Huỷ</button>
              <button onClick={() => setStep(1)} style={{
                flex: 2, padding: '14px',
                background: 'var(--lb-gold)', border: 'none', color: 'var(--lb-surface)',
                fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
                fontSize: 10, fontWeight: 600, letterSpacing: 3,
                textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--lb-gold-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--lb-gold)'; }}
              >Tiếp Theo</button>
            </>
          )}

          {step === 1 && (
            <>
              <button onClick={() => { setStep(0); setError(null); }} style={{
                flex: 1, padding: '14px',
                background: 'transparent', border: '1px solid var(--lb-gold-20)',
                color: 'color-mix(in srgb, var(--lb-text), transparent 50%)',
                fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
                fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-45)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--lb-gold)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lb-gold-20)'; (e.currentTarget as HTMLButtonElement).style.color = 'color-mix(in srgb, var(--lb-text), transparent 50%)'; }}
              >Quay Lại</button>
              <button onClick={handleSubmit} disabled={loading} style={{
                flex: 2, padding: '14px',
                background: loading ? 'var(--lb-gold-45)' : 'var(--lb-gold)',
                border: 'none', color: 'var(--lb-surface)',
                fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
                fontSize: 10, fontWeight: 600, letterSpacing: 3,
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--lb-gold-hover)'; }}
                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--lb-gold)'; }}
              >{loading ? 'Đang Xử Lý...' : 'Xác Nhận Đặt Bàn'}</button>
            </>
          )}

          {step === 2 && (
            <button onClick={onClose} style={{
              flex: 1, padding: '14px',
              background: 'transparent', border: '1px solid var(--lb-gold-30)',
              color: 'var(--lb-gold)',
              fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
              fontSize: 10, fontWeight: 600, letterSpacing: 3,
              textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--lb-gold-10)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >Đóng</button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
