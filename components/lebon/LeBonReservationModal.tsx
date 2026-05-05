'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import LeBonContactStep from './reservation/LeBonContactStep';
import LeBonScheduleStep from './reservation/LeBonScheduleStep';
import LeBonSuccessStep from './reservation/LeBonSuccessStep';
import LeBonTableStep from './reservation/LeBonTableStep';
import { LB, LeBonBooking, LeBonContact, LeBonSelectedTable } from './reservation/types';

// ─── Step enum ────────────────────────────────────────────────────────────────
type Step = 0 | 1 | 2 | 3;
// 0 = Schedule, 1 = Table, 2 = Contact, 3 = Success

const STEP_LABELS = ['Lịch', 'Bàn', 'Thông Tin', 'Xác Nhận'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isFuture = (date: string, time: string) =>
  dayjs(`${date}T${time}:00`).isAfter(dayjs());

const initialBooking: LeBonBooking = {
  date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
  time: '19:00',
  guests: 2,
};

const initialContact: LeBonContact = {
  name: '', phone: '', email: '', requests: '',
};

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step }: { step: Step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEP_LABELS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: active ? 28 : 22,
                height: active ? 28 : 22,
                borderRadius: '50%',
                background: done ? LB.color.gold : active ? LB.color.gold : 'rgba(201,168,76,0.12)',
                border: done || active ? 'none' : `1px solid ${LB.color.goldBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polyline points="2,5 4,7.5 8,2.5" stroke={LB.color.surface} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{
                    fontFamily: LB.font.sans, fontSize: 9, fontWeight: 700,
                    color: active ? LB.color.surface : LB.color.goldSoft,
                  }}>{i + 1}</span>
                )}
              </div>
              <span style={{
                fontFamily: LB.font.sans, fontSize: 8, letterSpacing: 1.5,
                color: active ? LB.color.gold : done ? LB.color.goldSoft : 'rgba(201,168,76,0.35)',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
                transition: 'color 0.3s',
              }}>{label}</span>
            </div>
            {i < 3 && (
              <div style={{
                flex: 1, height: 1, margin: '0 6px',
                background: done ? LB.color.gold : LB.color.goldBorder,
                transition: 'background 0.3s',
                marginBottom: 16,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Gold divider ─────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${LB.color.goldBorder}, transparent)` }} />
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  tenantId?: string;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function LeBonReservationModal({ open, onClose, tenantId }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [booking, setBooking] = useState<LeBonBooking>({ ...initialBooking });
  const [selectedTables, setSelectedTables] = useState<LeBonSelectedTable[]>([]);
  const [contact, setContact] = useState<LeBonContact>({ ...initialContact });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // ── Mount / unmount ────────────────────────────────────────────────────────
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
        // Reset all state
        setStep(0);
        setBooking({ ...initialBooking });
        setSelectedTables([]);
        setContact({ ...initialContact });
        setError(null);
        setConfirmationCode('');
        setReservationId('');
        setCheckoutUrl(null);
        setPaymentDeadline(null);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = () => {
    setError(null);

    if (step === 0) {
      if (!isFuture(booking.date, booking.time)) {
        setError('Vui lòng chọn thời gian trong tương lai.');
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      // Table selection is optional — allow skipping
      setStep(2);
      return;
    }

    if (step === 2) {
      handleSubmit();
    }
  };

  const goBack = () => {
    setError(null);
    if (step > 0) setStep((step - 1) as Step);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!contact.name.trim() || !contact.phone.trim()) {
      setError('Vui lòng điền họ tên và số điện thoại.');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (contact.email.trim() && !emailRegex.test(contact.email.trim())) {
      setError('Email không hợp lệ.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { reservationService } = await import('@/lib/services/reservationService');

      // Validate tables if selected
      if (selectedTables.length > 0) {
        await reservationService.checkTables({
          tableIds: selectedTables.map(t => t.id),
          reservationDateTime: `${booking.date}T${booking.time}:00`,
          numberOfGuests: booking.guests,
        });
      }

      const result = await reservationService.createReservation({
        tableIds: selectedTables.map(t => t.id),
        reservationDateTime: `${booking.date}T${booking.time}:00`,
        numberOfGuests: booking.guests,
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        specialRequests: contact.requests.trim() || undefined,
      });

      const raw = result as any;
      const rawId: string = raw?.id || raw?.Id || raw?.reservationId || '';
      const code =
        raw?.confirmationCode || raw?.ConfirmationCode ||
        (rawId ? rawId.replace(/-/g, '').slice(0, 6).toUpperCase() : 'N/A');

      setConfirmationCode(code);
      setReservationId(rawId);
      setCheckoutUrl(raw?.checkoutUrl || raw?.CheckoutUrl || null);
      setPaymentDeadline(raw?.paymentDeadline || raw?.PaymentDeadline || null);
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  // ── Step titles ────────────────────────────────────────────────────────────
  const stepTitle = [
    <>Đặt Bàn <em style={{ fontStyle: 'italic', color: LB.color.gold }}>Trực Tuyến</em></>,
    <>Chọn <em style={{ fontStyle: 'italic', color: LB.color.gold }}>Bàn</em></>,
    <>Thông Tin <em style={{ fontStyle: 'italic', color: LB.color.gold }}>Liên Hệ</em></>,
    <>Đặt Bàn <em style={{ fontStyle: 'italic', color: LB.color.gold }}>Thành Công</em></>,
  ][step];

  // ── Footer buttons ─────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (step === 3) {
      return (
        <button onClick={onClose} style={{
          flex: 1, padding: '14px',
          background: 'transparent', border: `1px solid ${LB.color.goldSoft}`,
          color: LB.color.gold,
          fontFamily: LB.font.sans, fontSize: 10, fontWeight: 600, letterSpacing: 3,
          textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >Đóng</button>
      );
    }

    return (
      <>
        {/* Back / Cancel */}
        <button
          onClick={step === 0 ? onClose : goBack}
          style={{
            flex: 1, padding: '14px',
            background: 'transparent', border: `1px solid ${LB.color.goldBorder}`,
            color: LB.color.textMuted,
            fontFamily: LB.font.sans, fontSize: 10, letterSpacing: 2,
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder45; (e.currentTarget as HTMLButtonElement).style.color = LB.color.gold; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder; (e.currentTarget as HTMLButtonElement).style.color = LB.color.textMuted; }}
        >
          {step === 0 ? 'Huỷ' : 'Quay Lại'}
        </button>

        {/* Next / Submit */}
        <button
          onClick={goNext}
          disabled={loading}
          style={{
            flex: 2, padding: '14px',
            background: loading ? 'rgba(201,168,76,0.45)' : LB.color.gold,
            border: 'none', color: LB.color.surface,
            fontFamily: LB.font.sans, fontSize: 10, fontWeight: 600, letterSpacing: 3,
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          {loading
            ? 'Đang Xử Lý...'
            : step === 1
              ? selectedTables.length > 0
                ? `Tiếp Theo (${selectedTables.length} bàn)`
                : 'Tiếp Theo (Không chọn bàn)'
              : step === 2
                ? 'Xác Nhận Đặt Bàn'
                : 'Tiếp Theo'}
        </button>
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>
      {/* Backdrop */}
      <div onClick={step < 3 ? onClose : undefined} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(4,12,7,0.88)',
        backdropFilter: 'blur(6px)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%',
        maxWidth: step === 1 ? 720 : 560,  // wider for table map
        background: LB.color.card,
        border: `1px solid ${LB.color.goldBorder}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1), max-width 0.4s ease',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '22px 28px 18px',
          borderBottom: `1px solid rgba(201,168,76,0.12)`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: LB.font.sans, fontSize: 9, letterSpacing: 4,
              color: LB.color.gold, textTransform: 'uppercase', margin: '0 0 6px',
            }}>Le Bon · Steak & Wine</p>
            <h2 style={{
              fontFamily: LB.font.serif, fontSize: 24, fontWeight: 400,
              color: LB.color.text, margin: '0 0 14px',
            }}>{stepTitle}</h2>
            {step < 3 && <StepBar step={step} />}
          </div>

          {/* Close button */}
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${LB.color.goldBorder}`,
            width: 34, height: 34, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.gold; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder; }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line x1="1" y1="1" x2="10" y2="10" stroke={LB.color.gold} strokeWidth="1.5" />
              <line x1="10" y1="1" x2="1" y2="10" stroke={LB.color.gold} strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{
          padding: step === 1 ? '20px 24px' : '24px 28px',
          overflowY: 'auto', flex: 1,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {step === 0 && (
            <LeBonScheduleStep booking={booking} onChange={setBooking} />
          )}

          {step === 1 && (
            <LeBonTableStep
              booking={booking}
              tenantId={tenantId}
              selected={selectedTables}
              onSelect={setSelectedTables}
            />
          )}

          {step === 2 && (
            <LeBonContactStep
              booking={booking}
              selectedTables={selectedTables}
              contact={contact}
              onChange={setContact}
              error={error}
            />
          )}

          {step === 3 && (
            <LeBonSuccessStep
              booking={booking}
              contact={contact}
              selectedTables={selectedTables}
              confirmationCode={confirmationCode}
              reservationId={reservationId}
              checkoutUrl={checkoutUrl}
              paymentDeadline={paymentDeadline}
            />
          )}

          {/* Error for step 0 */}
          {step === 0 && error && (
            <div style={{
              padding: '12px 16px',
              background: LB.color.errorBg,
              border: `1px solid ${LB.color.errorBorder}`,
              fontFamily: LB.font.serif, fontSize: 15,
              color: LB.color.error,
            }}>{error}</div>
          )}
        </div>

        {/* ── Divider ── */}
        <GoldDivider />

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 28px',
          display: 'flex', gap: 10,
        }}>
          {renderFooter()}
        </div>
      </div>
    </div>,
    document.body,
  );
}
