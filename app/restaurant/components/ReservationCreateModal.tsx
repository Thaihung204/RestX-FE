'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import { DatePicker } from 'antd';
import { reservationService, CreateReservationResponse } from '@/lib/services/reservationService';
import { useTranslation } from 'react-i18next';
import type { TableData } from '@/app/admin/tables/components/DraggableTable';

interface ReservationCreateModalProps {
  open: boolean;
  table: TableData | null;
  initialForm?: Partial<typeof initialFormState>;
  onClose: () => void;
  onSuccess?: (result: CreateReservationResponse) => void;
}

const initialFormState = {
  date: dayjs().format('YYYY-MM-DD'),
  time: '19:00',
  guests: 2,
  name: '',
  phone: '',
  email: '',
  requests: '',
};

const getTodayLocalDate = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
};

const isFutureReservationTime = (date: string, time: string) => {
  const selectedDateTime = dayjs(`${date}T${time}:00`);
  return selectedDateTime.isValid() && selectedDateTime.isAfter(dayjs());
};

export const ReservationCreateModal: React.FC<ReservationCreateModalProps> = ({
  open,
  table,
  initialForm,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...initialFormState, ...initialForm });
  const [loading, setLoading] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [depositCheckoutUrl, setDepositCheckoutUrl] = useState<string | null>(null);
  const [depositPaymentDeadline, setDepositPaymentDeadline] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ ...initialFormState, ...initialForm });
    setConfirmationCode(null);
    setDepositCheckoutUrl(null);
    setDepositPaymentDeadline(null);
    setError(null);
  }, [table, initialForm]);

  const handleClose = () => {
    setForm({ ...initialFormState, ...initialForm });
    setConfirmationCode(null);
    setDepositCheckoutUrl(null);
    setDepositPaymentDeadline(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!table) return;
    if (!form.name || !form.phone) {
      setError(t('landing.booking.confirm.error_required'));
      return;
    }

    if (!isFutureReservationTime(form.date, form.time)) {
      setError(t('reservation_detail.edit.date_in_past', { defaultValue: 'Reservation time must be in the future.' }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reservationDateTime = `${form.date}T${form.time}:00`;
      const result = await reservationService.createReservation({
        tableIds: [table.id],
        reservationDateTime,
        numberOfGuests: form.guests,
        name: form.name,
        phone: form.phone,
        email: form.email,
        specialRequests: form.requests || undefined,
      });

      onSuccess?.(result);

      const raw = result as any;
      const rawId: string = raw?.id || raw?.Id || raw?.reservationId || '';
      const resolvedCode =
        raw?.confirmationCode ||
        raw?.ConfirmationCode ||
        raw?.confirmation_code ||
        raw?.bookingCode ||
        (rawId ? rawId.replace(/-/g, '').slice(0, 6).toUpperCase() : '');
      const checkoutUrl: string | null = raw?.checkoutUrl || raw?.CheckoutUrl || null;
      const paymentDeadline: string | null = raw?.paymentDeadline || raw?.PaymentDeadline || null;
      setConfirmationCode(resolvedCode || rawId || '');
      setDepositCheckoutUrl(checkoutUrl);
      setDepositPaymentDeadline(paymentDeadline);
    } catch (err: any) {
      const beMessage = err?.response?.data?.message;
      setError(beMessage || t('landing.booking.confirm.error_generic'));
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card)',
              borderRadius: 20,
              width: '100%',
              maxWidth: 520,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                padding: '28px 32px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {t('landing.booking.table_map.confirm_table')}
              </h3>
              <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                {table?.name ? `${t('landing.booking.confirm.selected_table')} ${table.name}` : t('landing.booking.confirm.selected_table')}
              </p>
            </div>

            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {confirmationCode ? (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'var(--success-soft)',
                      color: 'var(--success)',
                      margin: '0 auto 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                    }}
                  >
                    ✓
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                    {t('landing.booking.success.title')}
                  </p>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                    {t('landing.booking.success.booking_ref')}: <strong>{confirmationCode}</strong>
                  </p>
                  {depositCheckoutUrl && (
                    <div style={{ marginBottom: 16 }}>
                      <button
                        onClick={() => {
                          window.location.href = depositCheckoutUrl;
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 20px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'var(--success)',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {t('landing.booking.success.pay_deposit_now', { defaultValue: 'Thanh toán cọc ngay' })}
                      </button>
                      {depositPaymentDeadline && (
                        <p style={{ color: 'var(--danger)', marginTop: 8, fontSize: 12 }}>
                          {t('landing.booking.success.deposit_deadline', { defaultValue: 'Hạn thanh toán cọc' })}: {new Date(depositPaymentDeadline).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleClose}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('landing.booking.success.make_another')}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        {t('landing.booking.confirm.date_time')}
                      </label>
                      <DatePicker
                        value={dayjs(form.date, 'YYYY-MM-DD')}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        style={{ width: '100%', marginTop: 8 }}
                        disabledDate={(current) => {
                          if (!current) return false;
                          return current.startOf('day').isBefore(dayjs().startOf('day'));
                        }}
                        onChange={(value) => {
                          if (!value) return;
                          const selectedDate = value.format('YYYY-MM-DD');
                          const safeDate = selectedDate < getTodayLocalDate() ? getTodayLocalDate() : selectedDate;
                          setForm((prev) => ({ ...prev, date: safeDate }));
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        {t('landing.booking.form.preferred_time')}
                      </label>
                      <input
                        type="time"
                        value={form.time}
                        min={form.date === getTodayLocalDate() ? dayjs().format('HH:mm') : undefined}
                        onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                        style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      {t('landing.booking.form.party_size')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={table?.seats ?? 20}
                      value={form.guests}
                      onChange={(e) => {
                        const cap = table?.seats ?? 20;
                        const nextValue = Math.min(Number(e.target.value) || 1, cap);
                        setForm((prev) => ({ ...prev, guests: nextValue }));
                      }}
                      style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        {t('landing.booking.confirm.full_name')}
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        {t('landing.booking.confirm.phone_number')}
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                        style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      {t('landing.booking.confirm.email')}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      {t('landing.booking.confirm.special_requests')}
                    </label>
                    <textarea
                      value={form.requests}
                      onChange={(e) => setForm((prev) => ({ ...prev, requests: e.target.value }))}
                      rows={3}
                      style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                    />
                  </div>

                  {error && (
                    <div style={{ padding: '10px 12px', background: 'rgba(255,77,79,0.1)', color: '#ff4d4f', borderRadius: 10, fontSize: 13 }}>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: 14,
                      background: 'var(--primary)',
                      color: 'var(--on-primary)',
                      fontWeight: 700,
                      fontSize: 16,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? t('landing.booking.confirm.processing') : t('landing.booking.confirm.complete_btn')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
