'use client';

import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DayPickerProps {
  value: Dayjs | null;
  onChange: (date: Dayjs) => void;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  placeholder?: string;
  disabled?: boolean;
}

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

export const DayPicker: React.FC<DayPickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Chọn ngày',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Dayjs>(value || dayjs());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (value) setViewDate(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= popoverHeight
        ? rect.bottom + window.scrollY + 6
        : rect.top + window.scrollY - popoverHeight - 6;
      const left = Math.min(rect.left + window.scrollX, window.innerWidth - 300 - 8);
      setPopoverStyle({ top, left: Math.max(8, left) });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const startOfMonth = viewDate.startOf('month');
  const daysInMonth = viewDate.daysInMonth();
  const firstDayOfWeek = startOfMonth.day(); // 0=Sun

  const cells: (Dayjs | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => startOfMonth.add(i, 'day')),
  ];

  const isDisabled = (d: Dayjs) => {
    if (minDate && d.isBefore(minDate, 'day')) return true;
    if (maxDate && d.isAfter(maxDate, 'day')) return true;
    return false;
  };

  const isSelected = (d: Dayjs) => value ? d.isSame(value, 'day') : false;
  const isToday = (d: Dayjs) => d.isSame(dayjs(), 'day');

  const prevMonth = () => setViewDate(v => v.subtract(1, 'month'));
  const nextMonth = () => setViewDate(v => v.add(1, 'month'));

  const popover = open && typeof document !== 'undefined' ? createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        zIndex: 9999,
        width: 300,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '16px',
        ...popoverStyle,
      }}
    >
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: 'var(--text)', fontSize: 16 }}
        >‹</button>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
          {MONTHS[viewDate.month()]} {viewDate.year()}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: 'var(--text)', fontSize: 16 }}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const disabled = isDisabled(d);
          const selected = isSelected(d);
          const today = isToday(d);
          return (
            <button
              key={d.format('YYYY-MM-DD')}
              disabled={disabled}
              onClick={() => { onChange(d); setOpen(false); }}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '6px 0',
                fontSize: 13,
                fontWeight: selected ? 700 : today ? 600 : 400,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: selected ? 'var(--primary)' : today ? 'var(--primary-soft, rgba(255,56,11,0.1))' : 'transparent',
                color: selected ? 'var(--on-primary, #fff)' : disabled ? 'var(--text-muted)' : today ? 'var(--primary)' : 'var(--text)',
                opacity: disabled ? 0.4 : 1,
                transition: 'background 0.15s',
              }}
            >
              {d.date()}
            </button>
          );
        })}
      </div>
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
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span style={{ flex: 1 }}>
          {value ? value.format('DD/MM/YYYY') : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {popover}
    </>
  );
};
