'use client';

import dayjs from 'dayjs';
import { LB, LeBonBooking, LeBonContact, LeBonSelectedTable } from './types';

interface Props {
  booking: LeBonBooking;
  contact: LeBonContact;
  selectedTables: LeBonSelectedTable[];
  confirmationCode: string;
  reservationId: string;
  checkoutUrl: string | null;
  paymentDeadline: string | null;
}

export default function LeBonSuccessStep({
  booking, contact, selectedTables,
  confirmationCode, reservationId,
  checkoutUrl, paymentDeadline,
}: Props) {
  const token = (confirmationCode || reservationId || '').trim();

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      {/* Check icon */}
      <div style={{
        width: 64, height: 64, margin: '0 auto 20px',
        border: `1px solid ${LB.color.gold}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polyline points="5,14 11,20 23,8" stroke={LB.color.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p style={{ fontFamily: LB.font.sans, fontSize: 9, letterSpacing: 4, color: LB.color.gold, textTransform: 'uppercase', marginBottom: 10 }}>
        Đặt Bàn Thành Công
      </p>

      <h3 style={{ fontFamily: LB.font.serif, fontSize: 26, fontWeight: 400, color: LB.color.text, marginBottom: 6 }}>
        Hẹn gặp bạn tại Le Bon
      </h3>

      <p style={{ fontFamily: LB.font.serif, fontSize: 15, fontStyle: 'italic', color: LB.color.textMuted, marginBottom: 24 }}>
        {dayjs(booking.date).format('dddd, DD/MM/YYYY')} lúc {booking.time} · {booking.guests} khách
      </p>

      {/* Selected tables */}
      {selectedTables.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20,
        }}>
          {selectedTables.map(t => (
            <span key={t.id} style={{
              fontFamily: LB.font.serif, fontSize: 14, color: LB.color.gold,
              padding: '3px 12px',
              border: `1px solid ${LB.color.goldBorder}`,
              background: 'rgba(201,168,76,0.06)',
            }}>
              Bàn #{t.code} · {t.zone}
            </span>
          ))}
        </div>
      )}

      {/* Confirmation code */}
      <div style={{
        padding: '14px 24px', margin: '0 auto 20px',
        background: 'rgba(201,168,76,0.06)',
        border: `1px solid ${LB.color.goldBorder}`,
        display: 'inline-block',
      }}>
        <p style={{ fontFamily: LB.font.sans, fontSize: 8, letterSpacing: 3, color: LB.color.goldSoft, textTransform: 'uppercase', margin: '0 0 6px' }}>
          Mã Xác Nhận
        </p>
        <p style={{ fontFamily: LB.font.serif, fontSize: 28, fontWeight: 600, color: LB.color.gold, margin: 0, letterSpacing: 4 }}>
          {confirmationCode || '—'}
        </p>
      </div>

      {/* Deposit payment */}
      {checkoutUrl && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => { window.location.href = checkoutUrl; }}
            style={{
              width: '100%', padding: '14px',
              background: LB.color.gold, border: 'none', color: LB.color.surface,
              fontFamily: LB.font.sans, fontSize: 10, fontWeight: 600, letterSpacing: 3,
              textTransform: 'uppercase', cursor: 'pointer', marginBottom: 8,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            Thanh Toán Đặt Cọc
          </button>
          {paymentDeadline && (
            <p style={{ fontFamily: LB.font.serif, fontSize: 13, fontStyle: 'italic', color: 'rgba(220,80,60,0.8)', margin: 0 }}>
              Hạn thanh toán: {new Date(paymentDeadline).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      )}

      {/* Contact note */}
      <p style={{ fontFamily: LB.font.serif, fontSize: 15, color: LB.color.textMuted, marginBottom: 20 }}>
        Chúng tôi sẽ liên hệ xác nhận qua số {contact.phone}
      </p>

      {/* View details */}
      <button
        onClick={() => {
          if (!token) return;
          window.location.href = `/your-reservation/${encodeURIComponent(token)}`;
        }}
        disabled={!token}
        style={{
          width: '100%', padding: '14px',
          background: 'transparent',
          border: `1px solid ${LB.color.goldSoft}`,
          color: LB.color.gold,
          fontFamily: LB.font.sans, fontSize: 10, fontWeight: 600, letterSpacing: 3,
          textTransform: 'uppercase', cursor: token ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          opacity: token ? 1 : 0.5,
        }}
        onMouseEnter={e => { if (token) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        Xem Chi Tiết Đặt Bàn
      </button>
    </div>
  );
}
