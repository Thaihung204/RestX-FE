'use client';

import { useState } from 'react';
import { BookingSummaryBar } from './LeBonScheduleStep';
import { LB, LeBonBooking, LeBonContact, LeBonSelectedTable } from './types';

// ─── Styled input helpers ─────────────────────────────────────────────────────
function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...LB.input,
        ...(focused ? { borderColor: LB.color.goldSoft } : {}),
        ...props.style,
      }}
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
        ...LB.input,
        padding: '12px 16px',
        resize: 'none',
        ...(focused ? { borderColor: LB.color.goldSoft } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={LB.label}>{label}</span>
      {children}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  booking: LeBonBooking;
  selectedTables: LeBonSelectedTable[];
  contact: LeBonContact;
  onChange: (c: LeBonContact) => void;
  error: string | null;
}

export default function LeBonContactStep({ booking, selectedTables, contact, onChange, error }: Props) {
  const set = (key: keyof LeBonContact) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...contact, [key]: e.target.value });

  return (
    <>
      {/* Booking summary */}
      <BookingSummaryBar booking={booking} />

      {/* Selected tables */}
      {selectedTables.length > 0 && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(201,168,76,0.05)',
          border: `1px solid ${LB.color.goldBorder}`,
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontFamily: LB.font.sans, fontSize: 9, letterSpacing: 2, color: LB.color.goldSoft, textTransform: 'uppercase' }}>
            Bàn đã chọn:
          </span>
          {selectedTables.map(t => (
            <span key={t.id} style={{
              fontFamily: LB.font.serif, fontSize: 14, color: LB.color.gold,
              padding: '2px 10px',
              border: `1px solid ${LB.color.goldBorder}`,
            }}>
              #{t.code}
            </span>
          ))}
        </div>
      )}

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Họ và Tên *">
          <StyledInput
            type="text" placeholder="Nguyễn Văn A"
            value={contact.name} onChange={set('name')}
          />
        </Field>
        <Field label="Số Điện Thoại *">
          <StyledInput
            type="tel" placeholder="0901 234 567"
            value={contact.phone} onChange={set('phone')}
          />
        </Field>
      </div>

      <Field label="Email">
        <StyledInput
          type="email" placeholder="email@example.com"
          value={contact.email} onChange={set('email')}
        />
      </Field>

      <Field label="Yêu Cầu Đặc Biệt">
        <StyledTextarea
          rows={3}
          placeholder="Dị ứng thực phẩm, dịp đặc biệt, yêu cầu về chỗ ngồi..."
          value={contact.requests} onChange={set('requests')}
        />
      </Field>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: LB.color.errorBg,
          border: `1px solid ${LB.color.errorBorder}`,
          fontFamily: LB.font.serif, fontSize: 15,
          color: LB.color.error,
        }}>{error}</div>
      )}
    </>
  );
}
