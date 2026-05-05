'use client';

import dayjs from 'dayjs';
import { GUEST_OPTIONS, LB, LB_TIME_SLOTS, LeBonBooking } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTodayLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().split('T')[0];
};
const getMaxDate = () => dayjs().add(1, 'month').format('YYYY-MM-DD');

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_VI = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'];

// ─── DateGrid ─────────────────────────────────────────────────────────────────
function DateGrid({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const today = getTodayLocal();
  const max = getMaxDate();
  const days: string[] = [];
  for (let i = 1; i <= 14; i++) days.push(dayjs().add(i, 'day').format('YYYY-MM-DD'));

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
      {days.map(d => {
        const dj = dayjs(d);
        const selected = d === value;
        const disabled = d < today || d > max;
        return (
          <button key={d} disabled={disabled} onClick={() => onChange(d)} style={{
            flexShrink: 0, width: 52, padding: '10px 0',
            background: selected ? LB.color.gold : 'rgba(255,255,255,0.04)',
            border: selected ? 'none' : `1px solid ${LB.color.goldBorder}`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.3 : 1,
            transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}
            onMouseEnter={e => { if (!selected && !disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder45; }}
            onMouseLeave={e => { if (!selected && !disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder; }}
          >
            <span style={{ fontFamily: LB.font.sans, fontSize: 8, letterSpacing: 1, color: selected ? LB.color.surface : LB.color.textMuted, textTransform: 'uppercase' }}>
              {DAY_LABELS[dj.day()]}
            </span>
            <span style={{ fontFamily: LB.font.serif, fontSize: 22, fontWeight: 600, lineHeight: 1, color: selected ? LB.color.surface : LB.color.text }}>
              {dj.format('D')}
            </span>
            <span style={{ fontFamily: LB.font.sans, fontSize: 8, color: selected ? LB.color.surface : LB.color.textMuted }}>
              {MONTH_VI[dj.month()]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── TimeGrid ─────────────────────────────────────────────────────────────────
function TimeGrid({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {LB_TIME_SLOTS.map(t => {
        const selected = t === value;
        return (
          <button key={t} onClick={() => onChange(t)} style={{
            padding: '9px 0',
            background: selected ? LB.color.gold : 'rgba(255,255,255,0.04)',
            border: selected ? 'none' : `1px solid ${LB.color.goldBorder}`,
            color: selected ? LB.color.surface : LB.color.text,
            fontFamily: LB.font.serif, fontSize: 15, fontWeight: selected ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder45; }}
            onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder; }}
          >{t}</button>
        );
      })}
    </div>
  );
}

// ─── GuestSelector ────────────────────────────────────────────────────────────
function GuestSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {GUEST_OPTIONS.map(n => {
        const selected = n === value;
        return (
          <button key={n} onClick={() => onChange(n)} style={{
            width: 44, height: 44,
            background: selected ? LB.color.gold : 'rgba(255,255,255,0.04)',
            border: selected ? 'none' : `1px solid ${LB.color.goldBorder}`,
            color: selected ? LB.color.surface : LB.color.text,
            fontFamily: LB.font.serif, fontSize: 17, fontWeight: selected ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder45; }}
            onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = LB.color.goldBorder; }}
          >{n}</button>
        );
      })}
      <button onClick={() => onChange(Math.min(value + 1, 20))} style={{
        width: 44, height: 44,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${LB.color.goldBorder}`,
        color: LB.color.textMuted,
        fontFamily: LB.font.serif, fontSize: 20, cursor: 'pointer',
      }}>+</button>
    </div>
  );
}

// ─── GoldLine ─────────────────────────────────────────────────────────────────
function GoldLine() {
  return <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.30), transparent)', margin: '4px 0' }} />;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={LB.label}>{label}</span>
      {children}
    </div>
  );
}

// ─── Summary bar ─────────────────────────────────────────────────────────────
export function BookingSummaryBar({ booking }: { booking: LeBonBooking }) {
  return (
    <div style={{
      padding: '12px 18px',
      background: LB.color.goldFaint,
      border: `1px solid ${LB.color.goldBorder}`,
      display: 'flex', gap: 24, flexWrap: 'wrap',
    }}>
      {[
        { label: 'Ngày', value: dayjs(booking.date).format('DD/MM/YYYY') },
        { label: 'Giờ', value: booking.time },
        { label: 'Khách', value: `${booking.guests} người` },
      ].map(({ label, value }) => (
        <div key={label}>
          <p style={{ fontFamily: LB.font.sans, fontSize: 8, letterSpacing: 2, color: LB.color.goldSoft, textTransform: 'uppercase', margin: '0 0 3px' }}>{label}</p>
          <p style={{ fontFamily: LB.font.serif, fontSize: 16, color: LB.color.text, margin: 0 }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
interface Props {
  booking: LeBonBooking;
  onChange: (b: LeBonBooking) => void;
}

export default function LeBonScheduleStep({ booking, onChange }: Props) {
  return (
    <>
      <Field label="Ngày">
        <DateGrid value={booking.date} onChange={d => onChange({ ...booking, date: d })} />
      </Field>

      <GoldLine />

      <Field label="Giờ Đến">
        <TimeGrid value={booking.time} onChange={t => onChange({ ...booking, time: t })} />
      </Field>

      <GoldLine />

      <Field label="Số Khách">
        <GuestSelector value={booking.guests} onChange={n => onChange({ ...booking, guests: n })} />
        {booking.guests > 8 && (
          <p style={{ fontFamily: LB.font.serif, fontSize: 14, fontStyle: 'italic', color: LB.color.goldSoft, marginTop: 8 }}>
            Nhóm trên 8 người — chúng tôi sẽ liên hệ xác nhận bàn phù hợp.
          </p>
        )}
      </Field>

      {/* Preview */}
      <BookingSummaryBar booking={booking} />
    </>
  );
}
