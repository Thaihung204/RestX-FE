'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MIN_ADVANCE_BOOKING_MINUTES } from '@/lib/utils/reservationTimeRules';

interface TimePickerProps {
  value: string;        // "HH:mm"
  onChange: (time: string) => void;
  minTime?: string;     // "HH:mm" — giờ mở cửa
  maxTime?: string;     // "HH:mm" — giờ đóng cửa
  isToday?: boolean;    // true → áp dụng guard cách hiện tại 30 phút
  placeholder?: string;
  disabled?: boolean;
}

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const fmt = (h: number, m: number) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  minTime,
  maxTime,
  isToday = false,
  placeholder = 'Chọn giờ',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const parsedHour = value ? parseInt(value.split(':')[0], 10) : 19;
  const parsedMin  = value ? parseInt(value.split(':')[1], 10) : 0;

  // Effective lower bound in minutes
  const openMins  = minTime ? toMins(minTime) : 0;
  const closeMins = maxTime ? toMins(maxTime) : 23 * 60 + 59;

  // When isToday, earliest selectable = now + 30 min
  const getEarliestMins = () =>
    isToday ? Math.max(openMins, nowMinutes() + MIN_ADVANCE_BOOKING_MINUTES) : openMins;

  // Is a specific hour:minute combo selectable?
  const isSlotDisabled = (h: number, m: number) => {
    const total = h * 60 + m;
    return total < getEarliestMins() || total > closeMins;
  };

  // Hours: all 24h, but mark disabled if no valid minute exists in that hour
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const isHourDisabled = (h: number) => {
    for (let m = 0; m < 60; m++) {
      if (!isSlotDisabled(h, m)) return false;
    }
    return true;
  };

  // Minutes: full 00-59, but mark disabled ones
  const allMinutes = Array.from({ length: 60 }, (_, i) => i);

  // ── Popover positioning ──
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const ph = 280;
      const popoverWidth = Math.min(240, window.innerWidth - 16);
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= ph
        ? rect.bottom + 6
        : rect.top - ph - 6;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - popoverWidth - 8);
      setPopoverStyle({ top: Math.max(8, top), left: Math.max(8, left) });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  // ── Close on outside click ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Scroll selected into view ──
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      [hourRef, minRef].forEach(ref => {
        const el = ref.current?.querySelector('[data-selected="true"]') as HTMLElement | null;
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  const handleHourClick = (h: number) => {
    if (isHourDisabled(h)) return;
    // Keep current minute if valid, else pick first valid minute for this hour
    let newMin = parsedMin;
    if (isSlotDisabled(h, newMin)) {
      const first = allMinutes.find(m => !isSlotDisabled(h, m));
      newMin = first ?? 0;
    }
    onChange(fmt(h, newMin));
  };

  const handleMinClick = (m: number) => {
    if (isSlotDisabled(parsedHour, m)) return;
    onChange(fmt(parsedHour, m));
  };

  // ── Styles ──
  const colStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    maxHeight: 200,
    scrollbarWidth: 'none',
  };

  const itemStyle = (selected: boolean, dis: boolean): React.CSSProperties => ({
    padding: '7px 0',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: selected ? 700 : 400,
    borderRadius: 8,
    cursor: dis ? 'not-allowed' : 'pointer',
    background: selected ? 'var(--primary)' : 'transparent',
    color: selected
      ? 'var(--on-primary, #fff)'
      : dis
        ? 'var(--text-muted)'
        : 'var(--text)',
    opacity: dis ? 0.3 : 1,
    transition: 'background 0.12s',
    userSelect: 'none',
  });

  const popover = open && typeof document !== 'undefined' ? createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        zIndex: 9999,
        width: 'min(240px, calc(100vw - 16px))',
        maxHeight: 'calc(100dvh - 16px)',
        overflow: 'auto',
        overscrollBehavior: 'contain',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '12px',
        ...popoverStyle,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', marginBottom: 8 }}>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Giờ</span>
        <span style={{ width: 16 }} />
        <span style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Phút</span>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
        {/* Hour column — all 24h, disabled ones greyed */}
        <div ref={hourRef} style={colStyle}>
          {allHours.map(h => {
            const dis = isHourDisabled(h);
            const sel = h === parsedHour;
            return (
              <div
                key={h}
                data-selected={sel}
                onClick={() => handleHourClick(h)}
                style={itemStyle(sel, dis)}
              >
                {String(h).padStart(2, '0')}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 700, color: 'var(--text-muted)', padding: '0 2px' }}>:</div>

        {/* Minute column — full 00-59, disabled ones greyed */}
        <div ref={minRef} style={colStyle}>
          {allMinutes.map(m => {
            const dis = isSlotDisabled(parsedHour, m);
            const sel = m === parsedMin;
            return (
              <div
                key={m}
                data-selected={sel}
                onClick={() => handleMinClick(m)}
                style={itemStyle(sel, dis)}
              >
                {String(m).padStart(2, '0')}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info hint when isToday */}
      {isToday && (
        <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--primary-soft, rgba(255,56,11,0.08))', borderRadius: 8, fontSize: 11, color: 'var(--primary)', textAlign: 'center' }}>
          Đặt trước ít nhất 30 phút
        </div>
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 12,
          border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
          background: 'var(--surface)',
          color: value ? 'var(--text)' : 'var(--text-muted)',
          fontSize: 14,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.2s',
          outline: 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--primary)' }}>
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ flex: 1 }}>{value || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {popover}
    </>
  );
};
