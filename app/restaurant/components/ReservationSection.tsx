'use client';

import { TableData } from '@/app/admin/tables/components/DraggableTable';
import { Layout, TableMap2D } from '@/app/admin/tables/components/TableMap2D';
import reservationService from '@/lib/services/reservationService';
import { FloorLayoutTableItem, floorService, tableService, TableStatus } from '@/lib/services/tableService';
import { TenantConfig } from '@/lib/services/tenantService';
import { GoogleGenAI, Type } from "@google/genai";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import TablePreview3DModal from './TablePreview3DModal';
import { BookingData, ReservationStep, Table, UserDetails } from './types';

import { DayPicker } from '@/components/ui/DayPicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { useAuth } from '@/lib/contexts/AuthContext';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────

const DEFAULT_TIME_SLOTS = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
const DEFAULT_SLOT_INTERVAL_MINUTES = 30;
const MAX_RESERVATION_ADVANCE_MONTHS = 1;
const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const APPLY_CLIENT_CURRENT_TIME_GUARD = false;

const TIME_SLOT_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

const normalizeDiacritics = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const dayTokenToIndex = (token: string): number | null => {
    const normalized = normalizeDiacritics(token).replace(/[^a-z0-9]/g, '');

    const mapping: Record<string, number> = {
        sunday: 0,
        sun: 0,
        cn: 0,
        chunhat: 0,
        monday: 1,
        mon: 1,
        t2: 1,
        thu2: 1,
        tuesday: 2,
        tue: 2,
        t3: 2,
        thu3: 2,
        wednesday: 3,
        wed: 3,
        t4: 3,
        thu4: 3,
        thursday: 4,
        thu: 4,
        t5: 4,
        thu5: 4,
        friday: 5,
        fri: 5,
        t6: 5,
        thu6: 5,
        saturday: 6,
        sat: 6,
        t7: 6,
        thu7: 6,
    };

    return mapping[normalized] ?? null;
};

const expandWeekdayRange = (start: number, end: number) => {
    const values: number[] = [];
    let cursor = start;

    while (true) {
        values.push(cursor);
        if (cursor === end) break;
        cursor = (cursor + 1) % 7;
        if (values.length > 7) break;
    }

    return values;
};

const collectWeekdayIndexes = (raw: string) => {
    const result = new Set<number>();
    const normalized = normalizeDiacritics(raw);
    const dayTokenPattern = '(sunday|sun|monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|chu\\s*nhat|cn|t\\s*[2-7]|thu\\s*[2-7])';

    const rangeRegex = new RegExp(`${dayTokenPattern}\\s*(?:-|to|den|->|=>)\\s*${dayTokenPattern}`, 'g');
    for (const match of normalized.matchAll(rangeRegex)) {
        const start = dayTokenToIndex(match[1] ?? '');
        const end = dayTokenToIndex(match[2] ?? '');
        if (start === null || end === null) continue;
        expandWeekdayRange(start, end).forEach((day) => result.add(day));
    }

    const singleTokenRegex = new RegExp(dayTokenPattern, 'g');
    for (const match of normalized.matchAll(singleTokenRegex)) {
        const day = dayTokenToIndex(match[0] ?? '');
        if (day !== null) result.add(day);
    }

    return result;
};

const parseTenantSettingsEntries = (raw: unknown): Array<{ key: string; value: string }> => {
    const pushEntry = (
        source: unknown,
        bucket: Array<{ key: string; value: string }>,
    ) => {
        if (!source || typeof source !== 'object') return;
        const key = ((source as any).key ?? (source as any).Key ?? '').toString().trim();
        if (!key) return;
        const value = ((source as any).value ?? (source as any).Value ?? '').toString();
        bucket.push({ key, value });
    };

    if (Array.isArray(raw)) {
        const entries: Array<{ key: string; value: string }> = [];
        raw.forEach((item) => pushEntry(item, entries));
        return entries;
    }

    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const entries: Array<{ key: string; value: string }> = [];
                parsed.forEach((item) => pushEntry(item, entries));
                return entries;
            }
        } catch {
            return [];
        }
    }

    return [];
};

const parseClosedWeekdaysValue = (raw: string) => {
    const parsedIndexes = new Set<number>();

    const trimmed = raw.trim();
    if (!trimmed) return parsedIndexes;

    try {
        const parsedJson = JSON.parse(trimmed);
        if (Array.isArray(parsedJson)) {
            parsedJson.forEach((item) => {
                if (typeof item === 'number' && item >= 0 && item <= 6) {
                    parsedIndexes.add(item);
                    return;
                }
                if (typeof item === 'string') {
                    const day = dayTokenToIndex(item);
                    if (day !== null) parsedIndexes.add(day);
                }
            });
            return parsedIndexes;
        }
    } catch {
        // Fallback to plain-text parsing below
    }

    collectWeekdayIndexes(trimmed).forEach((day) => parsedIndexes.add(day));

    for (const match of trimmed.matchAll(/(^|[\s,;\[\]])([0-6])(?=$|[\s,;\[\]])/g)) {
        const numericDay = Number(match[2]);
        if (numericDay >= 0 && numericDay <= 6) {
            parsedIndexes.add(numericDay);
        }
    }

    return parsedIndexes;
};

const parseWeeklyScheduleFromOpeningHours = (raw?: string | null) => {
    const openDays = new Set<number>();
    const closedDays = new Set<number>();
    if (!raw) return { openDays, closedDays };

    const segments = raw.split(/[;\n]+/).map((segment) => segment.trim()).filter(Boolean);
    if (!segments.length) {
        return { openDays, closedDays };
    }

    const closedKeywords = /(closed|off|nghi|dong\s*cua|khong\s*phuc\s*vu)/;

    for (const segment of segments) {
        const segmentDays = collectWeekdayIndexes(segment);
        if (!segmentDays.size) continue;

        if (closedKeywords.test(normalizeDiacritics(segment))) {
            segmentDays.forEach((day) => closedDays.add(day));
            continue;
        }

        if (parseOpeningHours(segment)) {
            segmentDays.forEach((day) => openDays.add(day));
        }
    }

    return { openDays, closedDays };
};

const normalizeTimeSlot = (slot: string) => {
    const trimmed = slot.trim();
    const match = trimmed.match(TIME_SLOT_PATTERN);
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const toMinutes = (slot: string) => {
    const normalized = normalizeTimeSlot(slot);
    if (!normalized) return null;
    const [hour, minute] = normalized.split(':').map(Number);
    return (hour * 60) + minute;
};

const fromMinutes = (totalMinutes: number) => {
    const dayMinutes = 24 * 60;
    const normalizedTotal = ((totalMinutes % dayMinutes) + dayMinutes) % dayMinutes;
    const hour = Math.floor(normalizedTotal / 60);
    const minute = normalizedTotal % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const normalizeTimeSlots = (slots: string[]) => {
    const unique = new Set<string>();
    for (const slot of slots) {
        const normalized = normalizeTimeSlot(slot);
        if (normalized) unique.add(normalized);
    }

    return Array.from(unique).sort((a, b) => {
        const minutesA = toMinutes(a) ?? 0;
        const minutesB = toMinutes(b) ?? 0;
        return minutesA - minutesB;
    });
};

const getSlotIntervalMinutes = (slots: string[]) => {
    const normalized = normalizeTimeSlots(slots);
    if (normalized.length < 2) return DEFAULT_SLOT_INTERVAL_MINUTES;

    let minDiff = Number.POSITIVE_INFINITY;
    for (let index = 1; index < normalized.length; index += 1) {
        const current = toMinutes(normalized[index]);
        const previous = toMinutes(normalized[index - 1]);
        if (current === null || previous === null) continue;

        const diff = current - previous;
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
        }
    }

    return Number.isFinite(minDiff) ? minDiff : DEFAULT_SLOT_INTERVAL_MINUTES;
};

const getTodayLocalDate = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
};

const getMaxBookableDate = () => dayjs().add(MAX_RESERVATION_ADVANCE_MONTHS, 'month').format('YYYY-MM-DD');

const getSelectableTimeBounds = (date: string, slots: string[]) => {
    const normalizedSlots = normalizeTimeSlots(slots);
    if (!normalizedSlots.length) return null;

    const firstSlotMinutes = toMinutes(normalizedSlots[0]);
    const lastSlotMinutes = toMinutes(normalizedSlots[normalizedSlots.length - 1]);
    if (firstSlotMinutes === null || lastSlotMinutes === null) return null;

    const intervalMinutes = Math.max(1, getSlotIntervalMinutes(normalizedSlots));
    const latestAllowedMinutes = Math.min((24 * 60) - 1, lastSlotMinutes + intervalMinutes);

    let minMinutes = firstSlotMinutes;
    if (APPLY_CLIENT_CURRENT_TIME_GUARD && date === getTodayLocalDate()) {
        const now = dayjs();
        const nowMinutes = (now.hour() * 60) + now.minute();
        minMinutes = Math.max(minMinutes, nowMinutes + 1);
    }

    if (minMinutes > latestAllowedMinutes) return null;

    return {
        min: fromMinutes(minMinutes),
        max: fromMinutes(latestAllowedMinutes),
    };
};

const isTimeWithinBounds = (
    time: string,
    bounds: { min: string; max: string } | null,
) => {
    if (!bounds) return false;

    const selectedMinutes = toMinutes(time);
    const minMinutes = toMinutes(bounds.min);
    const maxMinutes = toMinutes(bounds.max);

    if (selectedMinutes === null || minMinutes === null || maxMinutes === null) {
        return false;
    }

    return selectedMinutes >= minMinutes && selectedMinutes <= maxMinutes;
};

const clampTimeToBounds = (
    time: string,
    bounds: { min: string; max: string } | null,
) => {
    if (!bounds) return normalizeTimeSlot(time) || '';

    const selectedMinutes = toMinutes(time);
    const minMinutes = toMinutes(bounds.min);
    const maxMinutes = toMinutes(bounds.max);

    if (minMinutes === null || maxMinutes === null) {
        return normalizeTimeSlot(time) || '';
    }

    if (selectedMinutes === null) {
        return bounds.min;
    }

    if (selectedMinutes < minMinutes) {
        return bounds.min;
    }

    if (selectedMinutes > maxMinutes) {
        return bounds.max;
    }

    return fromMinutes(selectedMinutes);
};

const buildDisabledIntervalsFromBounds = (
    bounds: { min: string; max: string } | null,
) => {
    if (!bounds) return [] as string[];

    const minMinutes = toMinutes(bounds.min);
    const maxMinutes = toMinutes(bounds.max);
    if (minMinutes === null || maxMinutes === null) return [] as string[];

    const intervals: string[] = [];

    const firstDisabledEnd = minMinutes - 1;
    if (firstDisabledEnd >= 0) {
        intervals.push(`00:00 - ${fromMinutes(firstDisabledEnd)}`);
    }

    const secondDisabledStart = maxMinutes + 1;
    if (secondDisabledStart <= ((24 * 60) - 1)) {
        intervals.push(`${fromMinutes(secondDisabledStart)} - 23:59`);
    }

    return intervals;
};

// Removed TimepickerUI related code

// Removed TimepickerUI related code



const parseOpeningHours = (hours?: string | null) => {
    if (!hours) return null;
    const match = hours.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (!match) return null;
    return { open: match[1], close: match[2] };
};

const buildTimeSlotsFromHours = (open: string, close: string, intervalMinutes = DEFAULT_SLOT_INTERVAL_MINUTES) => {
    const baseDate = '1970-01-01';
    const start = dayjs(`${baseDate}T${open}`);
    const end = dayjs(`${baseDate}T${close}`);

    if (!start.isValid() || !end.isValid() || end.isBefore(start) || end.isSame(start)) {
        return [] as string[];
    }

    const slots: string[] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end)) {
        const next = current.add(intervalMinutes, 'minute');
        if (next.isAfter(end)) break;
        slots.push(current.format('HH:mm'));
        current = next;
    }

    return slots;
};

const getTenantReservationConfig = (tenant: TenantConfig | null) => {
    let timeSlots = DEFAULT_TIME_SLOTS;
    let maxGuestsOverride: number | undefined;
    let closedNotice = '';
    const closedWeekdays = new Set<number>();

    const openingHours = parseOpeningHours(tenant?.businessOpeningHours);
    if (openingHours) {
        const generatedSlots = buildTimeSlotsFromHours(openingHours.open, openingHours.close);
        if (generatedSlots.length) timeSlots = generatedSlots;
    }

    const weeklySchedule = parseWeeklyScheduleFromOpeningHours(tenant?.businessOpeningHours);
    if (weeklySchedule.openDays.size) {
        WEEK_DAYS.forEach((day) => {
            if (!weeklySchedule.openDays.has(day)) {
                closedWeekdays.add(day);
            }
        });
    }
    weeklySchedule.closedDays.forEach((day) => closedWeekdays.add(day));

    const settings = parseTenantSettingsEntries((tenant as any)?.tenantSettings ?? []);
    for (const raw of settings) {
        const key = raw.key.toString();
        const value = raw.value.toString();
        if (!key) continue;
        const lowerKey = key.toLowerCase();

        if (lowerKey === 'reservation.timeslots') {
            const parsed = value
                .split(/[,\s]+/)
                .map((v: string) => v.trim())
                .filter(Boolean);
            if (parsed.length) timeSlots = parsed;
        }

        if (lowerKey === 'reservation.maxguests') {
            const n = parseInt(value, 10);
            if (!Number.isNaN(n) && n > 0) {
                maxGuestsOverride = n;
            }
        }

        if (
            lowerKey === 'reservation.closeddays' ||
            lowerKey === 'reservation.closedweekdays' ||
            lowerKey === 'reservation.offdays' ||
            lowerKey === 'reservation.closeddaysofweek'
        ) {
            parseClosedWeekdaysValue(value).forEach((day) => closedWeekdays.add(day));
        }

        if (lowerKey === 'reservation.closednotice' && value.trim()) {
            closedNotice = value.trim();
        }
    }

    const normalizedTimeSlots = normalizeTimeSlots(timeSlots);

    return {
        timeSlots: normalizedTimeSlots.length ? normalizedTimeSlots : DEFAULT_TIME_SLOTS,
        maxGuestsOverride,
        closedWeekdays,
        closedNotice,
    };
};

interface ReservationSectionProps {
    tenant: TenantConfig | null;
}

const StepIndicator: React.FC<{ active: number; t: (key: string, options?: any) => string; className?: string; inverted?: boolean }> = ({ active, t, className = '', inverted = false }) => (
    <div className={`reservation-step-indicator flex items-center gap-1 ${className}`}>
        {[1, 2, 3].map((s) => {
            const isDone = s < active;
            const isActive = s === active;
            return (
                <React.Fragment key={s}>
                    <div className="flex items-center gap-1.5">
                        <span
                            className="reservation-step-dot grid shrink-0 place-items-center rounded-full text-[10px] font-bold leading-none"
                            style={{
                                width: isActive ? 26 : 20,
                                height: isActive ? 26 : 20,
                                backgroundColor: isDone || isActive ? (inverted ? 'var(--on-primary)' : 'var(--primary)') : (inverted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'),
                                color: isDone || isActive ? (inverted ? 'var(--primary)' : 'var(--on-primary)') : (inverted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'),
                                border: isDone || isActive ? 'none' : `1.5px solid ${inverted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'}`,
                                boxShadow: isActive ? (inverted ? '0 0 12px rgba(255,255,255,0.5)' : '0 0 12px var(--primary-glow)') : 'none',
                                transition: 'all 0.25s ease',
                            }}
                        >
                            {isDone ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                            ) : s}
                        </span>
                        <span
                            className="text-[11px] uppercase tracking-wider hidden sm:inline"
                            style={{
                                color: isActive ? 'var(--text-inverse)' : 'rgba(255,255,255,0.45)',
                                fontWeight: isActive ? 700 : 500,
                            }}
                        >
                            {s === 1 ? t('landing.booking.step.schedule') : s === 2 ? t('landing.booking.step.location') : t('landing.booking.step.confirm')}
                        </span>
                    </div>
                    {s < 3 && (
                        <div
                            className="shrink-0"
                            style={{
                                width: 20,
                                height: 1.5,
                                borderRadius: 1,
                                background: s < active ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                                transition: 'background 0.3s ease',
                            }}
                        />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

const ReservationSection: React.FC<ReservationSectionProps> = ({ tenant }) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [step, setStep] = useState<ReservationStep>(ReservationStep.SEARCH);
    const autoFilledRef = useRef(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 767px)');
        let timeoutId: NodeJS.Timeout;

        const syncViewport = () => {
            // Debounce để tránh re-render liên tục khi resize
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setIsMobileViewport(mediaQuery.matches);
            }, 100);
        };

        syncViewport();
        mediaQuery.addEventListener('change', syncViewport);

        return () => {
            clearTimeout(timeoutId);
            mediaQuery.removeEventListener('change', syncViewport);
        };
    }, []);
    const { timeSlots, closedWeekdays, closedNotice } = useMemo(
        () => getTenantReservationConfig(tenant),
        [tenant],
    );

    const isDateClosedByTenantSettings = useCallback((date: string) => {
        if (!closedWeekdays.size || !date) return false;
        const dayIndex = dayjs(date, 'YYYY-MM-DD').day();
        return closedWeekdays.has(dayIndex);
    }, [closedWeekdays]);

    const [booking, setBooking] = useState<BookingData>(() => ({
        date: getTodayLocalDate(),
        time: timeSlots.includes('19:00') ? '19:00' : (timeSlots[0] || '19:00'),
        guests: 4,
    }));

    const isBookingDayClosed = useMemo(
        () => isDateClosedByTenantSettings(booking.date),
        [booking.date, isDateClosedByTenantSettings],
    );

    const isBookingPastHoursToday = useMemo(() => {
        if (isBookingDayClosed) return false;
        if (booking.date !== getTodayLocalDate()) return false;

        return !getSelectableTimeBounds(booking.date, timeSlots);
    }, [booking.date, isBookingDayClosed, timeSlots]);

    const closedBookingDateValue = useMemo(() => {
        const value = new Date(`${booking.date}T00:00:00`);
        return Number.isNaN(value.getTime()) ? null : value;
    }, [booking.date]);

    const closedBookingWeekdayLabel = useMemo(() => {
        if (!closedBookingDateValue) return dayjs(booking.date, 'YYYY-MM-DD').format('dddd');
        try {
            return new Intl.DateTimeFormat(i18n.language || undefined, { weekday: 'long' }).format(closedBookingDateValue);
        } catch {
            return dayjs(booking.date, 'YYYY-MM-DD').format('dddd');
        }
    }, [booking.date, closedBookingDateValue, i18n.language]);

    const closedBookingDateLabel = useMemo(() => {
        if (!closedBookingDateValue) return booking.date;
        try {
            return new Intl.DateTimeFormat(i18n.language || undefined, {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(closedBookingDateValue);
        } catch {
            return booking.date;
        }
    }, [booking.date, closedBookingDateValue, i18n.language]);

    const closedBookingMessage = useMemo(() => {
        if (isBookingPastHoursToday) {
            return t('landing.booking.form.restaurant_past_hours_on_day', {
                day: closedBookingWeekdayLabel,
                defaultValue: `Restaurant has passed booking hours for ${closedBookingWeekdayLabel}`,
            });
        }

        if (closedNotice) return closedNotice;
        return t('landing.booking.form.restaurant_closed_on_day', {
            day: closedBookingWeekdayLabel,
            defaultValue: `Restaurant is closed on ${closedBookingWeekdayLabel}`,
        });
    }, [closedNotice, closedBookingWeekdayLabel, isBookingPastHoursToday, t]);

    const isClosedOverlayVisible = step === ReservationStep.SEARCH && (isBookingDayClosed || isBookingPastHoursToday);

    const nextAvailableBooking = useMemo(() => {
        if (!isBookingDayClosed && !isBookingPastHoursToday) return null;

        const start = dayjs(booking.date, 'YYYY-MM-DD');
        for (let offset = 1; offset <= 30; offset += 1) {
            const candidateDate = start.add(offset, 'day').format('YYYY-MM-DD');
            if (isDateClosedByTenantSettings(candidateDate)) continue;

            const candidateBounds = getSelectableTimeBounds(candidateDate, timeSlots);
            if (!candidateBounds) continue;

            return {
                date: candidateDate,
                time: candidateBounds.min,
            };
        }

        return null;
    }, [booking.date, isBookingDayClosed, isBookingPastHoursToday, isDateClosedByTenantSettings, timeSlots]);

    const handlePickNextAvailableDate = useCallback(() => {
        if (!nextAvailableBooking) return;
        setBooking((prev) => ({
            ...prev,
            date: nextAvailableBooking.date,
            time: nextAvailableBooking.time,
        }));
    }, [nextAvailableBooking]);

    const effectiveTimeSlots = useMemo(
        () => (isBookingDayClosed ? [] : timeSlots),
        [isBookingDayClosed, timeSlots],
    );

    const [layout, setLayout] = useState<Layout | null>(null);
    const [isLayoutLoading, setIsLayoutLoading] = useState(false);
    const [selectedTables, setSelectedTables] = useState<Table[]>([]);
    const [panoramaMap, setPanoramaMap] = useState<Map<string, { tableLabel: string; imageUrl: string }>>(new Map());
    const [is3DModalOpen, setIs3DModalOpen] = useState(false);
    const [panoramaTableData, setPanoramaTableData] = useState<TableData | null>(null);
    const [active360TableId, setActive360TableId] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails>({
        name: '',
        phone: '',
        email: '',
        requests: ''
    });
    const [recommendation, setRecommendation] = useState<string>('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [confirmationCode, setConfirmationCode] = useState<string>('');
    const [reservationId, setReservationId] = useState<string>('');
    const [depositCheckoutUrl, setDepositCheckoutUrl] = useState<string>('');
    const [depositPaymentDeadline, setDepositPaymentDeadline] = useState<string>('');
    const isTableSelectionStep = step === ReservationStep.TABLE_SELECTION;
    const isOverlayReservationStep = isTableSelectionStep || step === ReservationStep.CONFIRMATION || step === ReservationStep.SUCCESS;
    const isCompactReservationStep = step === ReservationStep.CONFIRMATION || step === ReservationStep.SUCCESS;

    const totalSelectedCapacity = useMemo(
        () => selectedTables.reduce((sum, table) => sum + (table.capacity || 0), 0),
        [selectedTables],
    );

    const selectableTimeBounds = useMemo(
        () => getSelectableTimeBounds(booking.date, effectiveTimeSlots),
        [booking.date, effectiveTimeSlots],
    );

    // Mobile time picker options
    const mobileTimeOptions = useMemo(() => {
        if (!selectableTimeBounds) return { hours: [], minutes: [] };

        const minHour = parseInt(selectableTimeBounds.min.split(':')[0]);
        const maxHour = parseInt(selectableTimeBounds.max.split(':')[0]);
        const minMinute = parseInt(selectableTimeBounds.min.split(':')[1]);
        const maxMinute = parseInt(selectableTimeBounds.max.split(':')[1]);

        // Generate available hours
        const hours = [];
        for (let h = minHour; h <= maxHour; h++) {
            hours.push(String(h).padStart(2, '0'));
        }

        // Generate available minutes for current selected hour
        const currentHour = parseInt(booking.time.split(':')[0] || '19');
        let startMin = 0;
        let endMin = 59;

        if (currentHour === minHour) {
            startMin = minMinute;
        }
        if (currentHour === maxHour) {
            endMin = maxMinute;
        }

        const minutes = [];
        for (let m = startMin; m <= endMin; m++) {
            minutes.push(String(m).padStart(2, '0'));
        }

        return { hours, minutes };
    }, [selectableTimeBounds, booking.time]);

    const isSelectedTimeValid = useMemo(
        () => isTimeWithinBounds(booking.time, selectableTimeBounds),
        [booking.time, selectableTimeBounds],
    );




    useEffect(() => {
        const today = getTodayLocalDate();
        const maxBookableDate = getMaxBookableDate();
        let nextDate = booking.date < today ? today : booking.date;
        if (nextDate > maxBookableDate) nextDate = maxBookableDate;

        const nextBounds = isDateClosedByTenantSettings(nextDate)
            ? null
            : getSelectableTimeBounds(nextDate, timeSlots);

        const normalizedCurrentTime = normalizeTimeSlot(booking.time) || booking.time;
        const nextTime = nextBounds
            ? clampTimeToBounds(normalizedCurrentTime, nextBounds)
            : normalizedCurrentTime;

        if (nextDate !== booking.date || nextTime !== booking.time) {
            setBooking(prev => ({ ...prev, date: nextDate, time: nextTime }));
        }
    }, [booking.date, booking.time, isDateClosedByTenantSettings, timeSlots]);

    // Auto-fill user info when logged in (only once, first time CONFIRMATION is opened)
    useEffect(() => {
        if (step === ReservationStep.CONFIRMATION && user && !autoFilledRef.current) {
            autoFilledRef.current = true;
            setUserDetails(prev => ({
                ...prev,
                name: prev.name || user.name || user.fullName || '',
                phone: prev.phone || user.phoneNumber || '',
                email: prev.email || user.email || '',
            }));
        }
    }, [step, user]);

    useEffect(() => {
        if (step === ReservationStep.TABLE_SELECTION) {
            const loadTables = async () => {
                setIsLayoutLoading(true);
                const finishLoading = () => setIsLayoutLoading(false);

                /** Convert BE shape string to TableData shape union */
                const normalizeShape = (s: string): 'Circle' | 'Rectangle' | 'Square' | 'Oval' => {
                    if (s === 'Round' || s === 'Circle') return 'Circle';
                    if (s === 'Oval') return 'Oval';
                    if (s === 'Square') return 'Square';
                    return 'Rectangle';
                };

                /** Convert numeric-string status from BE floor layout to TableData status */
                const parseLayoutStatus = (s: string): 'AVAILABLE' | 'OCCUPIED' => {
                    const normalized = s?.toLowerCase();
                    if (s === '1' || normalized === 'occupied') return 'OCCUPIED';
                    return 'AVAILABLE';
                };

                // ── Primary Path: GET /api/floors then /api/floors/{id}/layout ──
                try {
                    const allFloors = await floorService.getAllFloors();
                    const activeFloors = allFloors.filter(f => f.isActive !== false);

                    if (activeFloors.length > 0) {
                        const selectedAt = `${booking.date}T${booking.time}:00`;
                        // Fetch layout for each floor in parallel
                        const layoutResults = await Promise.allSettled(
                            activeFloors.map(f => floorService.getFloorLayout(f.id, selectedAt))
                        );

                        const floors = activeFloors.map((floorSummary, idx) => {
                            const layoutResult = layoutResults[idx];
                            const layoutData = layoutResult.status === 'fulfilled' ? layoutResult.value : null;

                            const tableDataList: TableData[] = (layoutData?.tables ?? []).map(
                                (t: FloorLayoutTableItem) => {
                                    return {
                                        id: t.id,
                                        tenantId: tenant?.id || 'default',
                                        name: t.code,
                                        seats: t.seatingCapacity,
                                        status: parseLayoutStatus(t.status),
                                        area: floorSummary.name,
                                        position: { x: Number(t.layout.x), y: Number(t.layout.y) },
                                        shape: normalizeShape(t.layout.shape),
                                        width: Number(t.layout.width) || 100,
                                        height: Number(t.layout.height) || 100,
                                        rotation: Number(t.layout.rotation) || 0,
                                        zoneId: floorSummary.name,
                                        photo360Url: (t as any).cubeFrontImageUrl || (
                                            floorSummary.name?.toLowerCase().includes('vip')
                                                ? "/images/restaurant/warm_restaurant.webp"
                                                : "/images/restaurant/bush_restaurant.webp"
                                        ),
                                    };
                                }
                            );
                            // DEBUG: show BE positions
                            console.log(`[Restaurant] Floor "${floorSummary.name}" tables:`, tableDataList.map(t => ({ id: t.id, code: t.name, x: t.position.x, y: t.position.y })));

                            return {
                                id: floorSummary.id,
                                name: floorSummary.name,
                                width: Number(layoutData?.floor.width ?? floorSummary.width ?? 1400),
                                height: Number(layoutData?.floor.height ?? floorSummary.height ?? 900),
                                backgroundImage: layoutData?.floor.backgroundImageUrl ?? floorSummary.imageUrl ?? undefined,
                                tables: tableDataList,
                            };
                        });

                        setLayout({
                            id: 'be-layout',
                            name: 'Main Layout',
                            activeFloorId: floors[0]?.id || '',
                            floors,
                        });
                        finishLoading();
                        return;
                    }
                } catch (err) {
                    console.warn('[ReservationSection] Floor API failed, falling back to getAllTables:', err);
                }

                // ── Fallback: GET /api/tables — group by table.type ──
                try {
                    const items = await tableService.getAllTables();
                    const activeTables = items.filter(t => t.isActive);
                    if (!activeTables.length) return;

                    const typeGroups = Array.from(new Set(activeTables.map(t => t.type || 'Indoor')));
                    const floors = typeGroups.map(typeName => {
                        const floorTables = activeTables.filter(t => (t.type || 'Indoor') === typeName);
                        const maxX = Math.max(...floorTables.map(t => (t.positionX ?? 0) + (t.width ?? 100)), 800);
                        const maxY = Math.max(...floorTables.map(t => (t.positionY ?? 0) + (t.height ?? 100)), 600);
                        const tableDataList: TableData[] = floorTables.map(t => {
                            let status: 'AVAILABLE' | 'OCCUPIED' = 'AVAILABLE';
                            if (t.tableStatusId === TableStatus.Occupied) status = 'OCCUPIED';
                            return {
                                id: t.id,
                                tenantId: tenant?.id || 'default',
                                name: t.code,
                                seats: t.seatingCapacity,
                                status,
                                area: typeName,
                                position: { x: t.positionX ?? 0, y: t.positionY ?? 0 },
                                shape: (t.shape === 'Round' || t.shape === 'Circle' ? 'Circle'
                                    : t.shape === 'Square' ? 'Square'
                                        : t.shape === 'Oval' ? 'Oval'
                                            : 'Rectangle') as 'Circle' | 'Rectangle' | 'Square' | 'Oval',
                                width: t.width ?? 100,
                                height: t.height ?? 100,
                                rotation: t.rotation ?? 0,
                                zoneId: typeName,
                                photo360Url: t.cubeFrontImageUrl || (
                                    typeName?.toLowerCase().includes('vip')
                                        ? "/images/restaurant/warm_restaurant.webp"
                                        : "/images/restaurant/bush_restaurant.webp"
                                ),
                            };
                        });
                        return {
                            id: typeName,
                            name: typeName,
                            width: maxX + 100,
                            height: maxY + 100,
                            tables: tableDataList,
                        };
                    });

                    setLayout({
                        id: 'fallback-layout',
                        name: 'Main Layout',
                        activeFloorId: floors[0]?.id || '',
                        floors,
                    });
                    finishLoading();
                } catch (error) {
                    console.error('[ReservationSection] Failed to load tables:', error);
                } finally {
                    finishLoading();
                }
            };
            loadTables();
        }
    }, [step, tenant]);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;
        const body = document.body;

        if (isOverlayReservationStep) {
            // Lưu scroll position trước khi lock
            const scrollY = window.scrollY;

            // Đóng tất cả popups/dropdowns trước khi mở overlay
            const closeAllPopups = () => {
                // Blur active element để Ant Design tự đóng popups
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
                // Trigger ESC để đóng các popups khác
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            };

            closeAllPopups();

            // Thêm class với debounce để tránh giật
            requestAnimationFrame(() => {
                root.classList.add('reservation-overlay-open');
                body.classList.add('reservation-overlay-open');

                // Fix cho mobile: giữ scroll position
                if (isMobileViewport) {
                    body.style.top = `-${scrollY}px`;
                    body.style.position = 'fixed';
                    body.style.width = '100%';
                }
            });

            return () => {
                requestAnimationFrame(() => {
                    root.classList.remove('reservation-overlay-open');
                    body.classList.remove('reservation-overlay-open');

                    // Restore scroll position cho mobile
                    if (isMobileViewport) {
                        body.style.position = '';
                        body.style.top = '';
                        body.style.width = '';
                        window.scrollTo(0, scrollY);
                    }
                });
            };
        }

        root.classList.remove('reservation-overlay-open');
        body.classList.remove('reservation-overlay-open');
    }, [isOverlayReservationStep, isMobileViewport]);

    // Đóng tất cả popups khi step thay đổi
    useEffect(() => {
        if (typeof document === 'undefined') return;

        // Blur active element để Ant Design tự đóng popups
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }, [step]);

    // Đóng DatePicker khi scroll
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let scrollTimer: ReturnType<typeof setTimeout>;
        const handleScroll = () => {
            // Debounce để tránh gọi liên tục khi scroll
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                // Blur active element để Ant Design tự đóng popups
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            }, 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            clearTimeout(scrollTimer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const buildSelectedTable = (table: TableData): Table => ({
        id: table.id,
        label: table.name,
        capacity: table.seats,
        isOccupied: false,
        isPremium: table.area === 'Window' || table.area === 'VIP',
        zone: table.area,
        x: table.position.x,
        y: table.position.y,
        width: table.width || 80,
        height: table.height || 80,
        shape: table.shape === 'Circle' ? 'Round' : 'Rectangle',
        rotation: table.rotation || 0,
    });

    const handleMapTableClick = async (table: TableData) => {
        const alreadySelected = selectedTables.some(t => t.id === table.id);

        setSelectedTables(prev => {
            if (alreadySelected) return prev.filter(t => t.id !== table.id);
            return [...prev, buildSelectedTable(table)];
        });

        if (alreadySelected) {
            // Remove panorama entry for this table
            setPanoramaMap(prev => {
                const next = new Map(prev);
                next.delete(table.id);
                return next;
            });
            if (active360TableId === table.id) {
                setIs3DModalOpen(false);
                setPanoramaTableData(null);
                setActive360TableId(null);
            }
            return;
        }

        try {
            const fullTable = await tableService.getTableById(table.id);
            console.log('[ReservationSection] getTableById response:', {
                id: fullTable?.id,
                code: fullTable?.code,
                defaultViewUrl: fullTable?.defaultViewUrl,
                cubeFrontImageUrl: fullTable?.cubeFrontImageUrl,
                has3DView: fullTable?.has3DView,
            });
            // Panorama 360 (equirectangular) — check both fields (admin may upload to either)
            const imageUrl = fullTable?.cubeFrontImageUrl || fullTable?.defaultViewUrl || '';
            if (imageUrl) {
                setPanoramaMap(prev => {
                    const next = new Map(prev);
                    next.set(table.id, {
                        tableLabel: table.name,
                        imageUrl,
                    });
                    return next;
                });
                setPanoramaTableData(table);
                setActive360TableId(table.id);
            }
        } catch (err) {
            console.warn('[ReservationSection] Failed to fetch table details for 360:', err);
        }
    };

    // --- Gemini Integration ---
    const getSmartRecommendation = async (guests: number, time: string) => {
        setIsAiThinking(true);
        try {
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY || ''; // Use NEXT_PUBLIC_ for client-side
            if (!apiKey) {
                console.warn("Gemini API Key missing");
                setRecommendation("We recommend our window seats for a breathtaking view of the city skyline.");
                return;
            }
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash', // Updated to a more standard model name if preview is not available, or keep user's. User used 'gemini-3-flash-preview' which might be valid for them. I'll stick to user's or safe fallback.
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `I have a party of ${guests} people arriving at ${time} for a Fine Dining experience. 
        Which table zone (Window, Central, or Bar) should I recommend? 
        Give me a short, elegant 1-sentence sales pitch for the recommendation. 
        Return as JSON with keys 'zone' and 'pitch'.`
                            }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            zone: { type: Type.STRING },
                            pitch: { type: Type.STRING }
                        },
                        required: ["zone", "pitch"]
                    }
                }
            });

            const text = response.text; // User snippet used response.text directly.
            const data = JSON.parse(text ? text.toString() : '{}');
            setRecommendation(data.pitch);
        } catch (error) {
            console.error("Gemini failed:", error);
            setRecommendation("We recommend our window seats for a breathtaking view of the city skyline.");
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isBookingDayClosed || isBookingPastHoursToday) {
            return;
        }

        const today = getTodayLocalDate();
        const maxBookableDate = getMaxBookableDate();
        let nextDate = booking.date < today ? today : booking.date;
        if (nextDate > maxBookableDate) nextDate = maxBookableDate;
        let nextBounds = getSelectableTimeBounds(nextDate, timeSlots);

        if (!nextBounds) return;

        const nextTime = clampTimeToBounds(booking.time, nextBounds);

        if (nextDate !== booking.date || nextTime !== booking.time) {
            setBooking(prev => ({ ...prev, date: nextDate, time: nextTime }));
        }

        try {
            const reservationDateTime = `${nextDate}T${nextTime}:00`;
            await reservationService.checkTime({ reservationDateTime });
        } catch (error: any) {
            console.error("Check time failed:", error);
            const beMessage = error?.response?.data?.message || error?.message;
            message.error(beMessage || t('landing.booking.confirm.error_generic', { defaultValue: 'An error occurred' }));
            return;
        }

        getSmartRecommendation(Number(booking.guests) || 1, nextTime);
        setStep(ReservationStep.TABLE_SELECTION);
    };

    const handleConfirmTableSelection = async () => {
        try {
            const reservationDateTime = `${booking.date}T${booking.time}:00`;
            await reservationService.checkTables({
                tableIds: selectedTables.map(t => t.id),
                reservationDateTime,
                numberOfGuests: Number(booking.guests)
            });
            setStep(ReservationStep.CONFIRMATION);
        } catch (error: any) {
            console.error("Check tables failed:", error);
            const beMessage = error?.response?.data?.message || error?.message;
            message.error(beMessage || t('landing.booking.confirm.error_generic', { defaultValue: 'An error occurred' }));
        }
    };


    // The old inline THREE.js panorama viewer has been replaced by TablePreview3DModal

    const handleCompleteReservation = async () => {
        if (selectedTables.length === 0) return;

        if (isBookingDayClosed) {
            setSubmitError(closedBookingMessage);
            return;
        }

        // Basic validation
        if (!userDetails.name || !userDetails.phone || !userDetails.email) {
            setSubmitError(t('landing.booking.confirm.error_required'));
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(userDetails.email)) {
            setSubmitError(t('landing.booking.confirm.error_invalid_email'));
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        setDepositCheckoutUrl('');
        setDepositPaymentDeadline('');

        try {
            // Combine date + time thành ISO datetime
            const reservationDateTime = `${booking.date}T${booking.time}:00`;

            const result = await reservationService.createReservation({
                tableIds: selectedTables.map(t => t.id),
                reservationDateTime,
                numberOfGuests: Number(booking.guests),
                name: userDetails.name,
                phone: userDetails.phone,
                email: userDetails.email,
                specialRequests: userDetails.requests || undefined,
            });

            const raw = result as any;
            // BE returns only `id` (UUID). Derive short display code from first 6 chars (uppercase).
            const rawId: string = raw?.id || raw?.Id || raw?.reservationId || '';
            const resolvedCode =
                raw?.confirmationCode ||
                raw?.ConfirmationCode ||
                raw?.confirmation_code ||
                raw?.bookingCode ||
                (rawId ? rawId.replace(/-/g, '').slice(0, 6).toUpperCase() : '');
            const checkoutUrl: string = raw?.checkoutUrl || raw?.CheckoutUrl || '';
            const paymentDeadline: string = raw?.paymentDeadline || raw?.PaymentDeadline || '';
            setConfirmationCode(resolvedCode);
            setReservationId(rawId);
            setDepositCheckoutUrl(checkoutUrl);
            setDepositPaymentDeadline(paymentDeadline);
            setStep(ReservationStep.SUCCESS);
        } catch (error: unknown) {
            console.error("Failed to create reservation:", error);
            // Hiển thị message lỗi từ BE nếu có
            const axiosError = error as { response?: { data?: { message?: string } } };
            const beMessage = axiosError?.response?.data?.message;
            setSubmitError(beMessage || t('landing.booking.confirm.error_generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPanoramaPreview = (table: Table) => {
        if (!panoramaMap.has(table.id)) return;

        setActive360TableId(table.id);
        setPanoramaTableData({
            id: table.id,
            tenantId: '',
            name: table.label,
            seats: table.capacity,
            status: 'AVAILABLE',
            area: table.zone,
            position: { x: table.x || 0, y: table.y || 0 },
            shape: table.shape === 'Round' ? 'Circle' : 'Rectangle',
            width: table.width || 80,
            height: table.height || 80,
            rotation: table.rotation || 0,
        } as TableData);
        setIs3DModalOpen(true);
    };

    const mobilePanoramaTable = (active360TableId
        ? selectedTables.find((table) => table.id === active360TableId && panoramaMap.has(table.id))
        : undefined) || selectedTables.find((table) => panoramaMap.has(table.id));

    const mobileSelectedTableSummary = selectedTables.length <= 2
        ? selectedTables.map((table) => `#${table.label}`).join(', ')
        : `${selectedTables.slice(0, 2).map((table) => `#${table.label}`).join(', ')} +${selectedTables.length - 2}`;

    return (
        <div id="reservation" className="reservation-root-frame relative text-[var(--text)] scroll-mt-20">
            {/* Background Layer */}
            <div className="reservation-bg-layer absolute inset-0 z-0">
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfPFwjLEKDFOt-mxPmzwYjzNLMEX3sT58UZGugJPCINRcDIw57-nX-MzWGzA5TyIMujN9sgVaAduJDds0CehlPSOV-sM1tcFsO5HkoObZMdVizGg68w6Z4wUrxxLYQh6j5_BJuPKL0ZWsABXLDlqrbMZcBCLWqecFrgUf0o_7_6X-peTbMorUQvBLZ3mdERB9kTTwNVnaNz11aTT9BQgKfyyGn7Wa_avn--DQijsUy8CG2lp80Pbia-cQMT8ekuG3rPRmDB3oR3xs"
                    alt="Restaurant Ambiance"
                    className="reservation-bg-image w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>

            {isClosedOverlayVisible && (
                <div className="reservation-closed-overlay" role="status" aria-live="polite">
                    <div className="reservation-closed-overlay-panel fade-in">
                        <div className="reservation-closed-overlay-badge">
                            <span className="material-symbols-outlined" aria-hidden="true">event_busy</span>
                            <span>{t('landing.booking.form.closed_overlay_badge', { defaultValue: 'Restaurant Closed' })}</span>
                        </div>

                        <h2 className="reservation-closed-overlay-title text-balance">
                            {t('landing.booking.form.closed_overlay_title', {
                                defaultValue: 'Reservations are unavailable for this day',
                            })}
                        </h2>

                        <p className="reservation-closed-overlay-description text-pretty">
                            {t('landing.booking.form.closed_overlay_description', {
                                defaultValue: 'Please choose another date to continue your booking.',
                            })}
                        </p>

                        <div className="reservation-closed-overlay-meta">
                            <div className="reservation-closed-overlay-meta-item">
                                <span className="reservation-closed-overlay-meta-label">
                                    {t('landing.booking.form.closed_overlay_selected_date', { defaultValue: 'Selected date' })}
                                </span>
                                <span className="reservation-closed-overlay-meta-value">{closedBookingDateLabel}</span>
                            </div>

                            <div className="reservation-closed-overlay-meta-item">
                                <span className="reservation-closed-overlay-meta-label">
                                    {t('landing.booking.form.closed_overlay_notice', { defaultValue: 'Notice' })}
                                </span>
                                <span className="reservation-closed-overlay-meta-value">{closedBookingMessage}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handlePickNextAvailableDate}
                            disabled={!nextAvailableBooking}
                            className="reservation-closed-overlay-action disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">event_available</span>
                            <span>
                                {t('landing.booking.form.closed_overlay_cta', {
                                    defaultValue: 'Pick next available date',
                                })}
                            </span>
                        </button>

                        <p className="reservation-closed-overlay-hint text-pretty">
                            {nextAvailableBooking
                                ? t('landing.booking.form.closed_overlay_hint', {
                                    defaultValue: 'Use the date picker below to select another day.',
                                })
                                : t('landing.booking.form.closed_overlay_no_next', {
                                    defaultValue: 'No available date found in the next 30 days.',
                                })}
                        </p>
                    </div>
                </div>
            )}

            <main className="reservation-main-shell relative z-10 mx-auto px-3 sm:px-4 flex flex-col items-center min-h-screen">

                {step === ReservationStep.SEARCH && (
                    <div className="reservation-search-shell w-full max-w-5xl px-0 fade-in flex-1 flex flex-col justify-center py-8 md:py-20">
                        <div className="reservation-hero-block text-center mb-8 sm:mb-12">
                            <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--primary-border)] bg-black/30 backdrop-blur-md text-[var(--primary)] text-xs font-bold tracking-[0.2em] uppercase mb-6 shadow-xl">
                                {t('landing.booking.hero.badge')}
                            </div>
                            <h1 className="reservation-hero-title text-3xl sm:text-4xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight font-serif text-balance" style={{ color: 'var(--text-inverse)' }}>
                                {t('landing.booking.hero.title_prefix')} <br />
                                <span style={{ color: 'var(--primary)' }}>
                                    {t('landing.booking.hero.title_highlight')}
                                </span>
                            </h1>
                            <p className="reservation-hero-description text-sm sm:text-base md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto font-light leading-relaxed text-pretty">
                                {t('landing.booking.hero.description')}
                            </p>
                        </div>

                        <div className="reservation-search-overlay">
                            <div className="reservation-search-card bg-[var(--card)] rounded-2xl sm:rounded-[2rem] shadow-2xl p-4 sm:p-6 md:p-10 border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--primary-soft)] to-[var(--primary)] rounded-t-2xl sm:rounded-t-[2rem]"></div>

                                <form onSubmit={handleSearchSubmit} className="reservation-pill">
                                    <div className="pill-segment relative" id="date-picker-anchor">
                                        <span className="pill-label">{t('landing.booking.form.arrival_date')}</span>
                                        <DayPicker
                                            value={dayjs(booking.date, 'YYYY-MM-DD')}
                                            minDate={dayjs(getTodayLocalDate(), 'YYYY-MM-DD')}
                                            maxDate={dayjs(getMaxBookableDate(), 'YYYY-MM-DD')}
                                            onChange={(value) => {
                                                const safeDate = value.format('YYYY-MM-DD');
                                                if (isDateClosedByTenantSettings(safeDate)) {
                                                    setBooking((prev) => ({ ...prev, date: safeDate }));
                                                    return;
                                                }
                                                const nextBounds = getSelectableTimeBounds(safeDate, timeSlots);
                                                setBooking((prev) => {
                                                    const nextTime = clampTimeToBounds(prev.time, nextBounds);
                                                    return { ...prev, date: safeDate, time: nextTime };
                                                });
                                            }}
                                        />
                                    </div>

                                    <div className="pill-divider" />

                                    <div className="pill-segment">
                                        <span className="pill-label">{t('landing.booking.form.preferred_time')}</span>
                                        <div className="w-full">
                                            {selectableTimeBounds ? (
                                                <div className="space-y-2">
                                                    <TimePicker
                                                        onChange={(value) => {
                                                            const clamped = clampTimeToBounds(value, selectableTimeBounds);
                                                            if (clamped) {
                                                                setBooking((prev) => ({ ...prev, time: clamped }));
                                                            }
                                                        }}
                                                        value={booking.time}
                                                        disabled={!selectableTimeBounds}
                                                        minTime={selectableTimeBounds?.min}
                                                        maxTime={selectableTimeBounds?.max}
                                                        isToday={booking.date === getTodayLocalDate()}
                                                    />
                                                    {/* <div className="text-xs text-[var(--text-muted)] text-center">
                                                        {t('landing.booking.form.available_hours', {
                                                            start: selectableTimeBounds.min,
                                                            end: selectableTimeBounds.max,
                                                            defaultValue: `Giờ phục vụ: ${selectableTimeBounds.min} - ${selectableTimeBounds.max}`
                                                        })}
                                                    </div> */}
                                                    {!isSelectedTimeValid && booking.time && (
                                                        <div className="text-xs text-[var(--danger)] text-center flex items-center justify-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">error</span>
                                                            <span>
                                                                {t('landing.booking.form.time_not_available', {
                                                                    defaultValue: 'Thời gian này không khả dụng. Vui lòng chọn trong khung giờ phục vụ.'
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-2">
                                                    <div className="text-sm text-[var(--text-muted)]">
                                                        {isBookingDayClosed
                                                            ? t('landing.booking.form.restaurant_closed_today', { defaultValue: 'Nhà hàng đóng cửa hôm nay' })
                                                            : t('landing.booking.form.no_available_time', { defaultValue: 'Không có giờ phục vụ' })
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pill-divider" />

                                    <div className="pill-segment pill-guests">
                                        <span className="pill-label">
                                            {t('landing.booking.form.party_size')}
                                        </span>
                                        <div className="pill-guest-row">
                                            <span className="material-symbols-outlined text-[var(--primary)] text-lg">person</span>
                                            <input
                                                type="number"
                                                value={booking.guests || ''}
                                                min="1"
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (e.target.value === '') {
                                                        // Allow temporary empty state while typing
                                                        setBooking(b => ({ ...b, guests: '' as any }));
                                                    } else if (!isNaN(val) && val >= 1) {
                                                        setBooking(b => ({ ...b, guests: val }));
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (isNaN(val) || val < 1) {
                                                        setBooking(b => ({ ...b, guests: 1 }));
                                                    }
                                                }}
                                                className="pill-guest-count w-10 text-center bg-transparent border-none outline-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <div className="pill-guest-actions">
                                                <button
                                                    type="button"
                                                    aria-label={t('landing.booking.form.decrease_guests')}
                                                    onClick={() => setBooking((b) => {
                                                        const currentGuests = Math.max(1, Number(b.guests) || 1);
                                                        return { ...b, guests: Math.max(1, currentGuests - 1) };
                                                    })}
                                                    className="pill-step-btn"
                                                >
                                                    −
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={t('landing.booking.form.increase_guests')}
                                                    onClick={() => setBooking((b) => {
                                                        const currentGuests = Math.max(1, Number(b.guests) || 1);
                                                        return { ...b, guests: currentGuests + 1 };
                                                    })}
                                                    className="pill-step-btn"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isBookingDayClosed || !selectableTimeBounds || !isSelectedTimeValid}
                                        className="pill-submit disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    >
                                        <span>
                                            {isBookingDayClosed
                                                ? t('landing.booking.form.restaurant_closed_today', { defaultValue: 'Restaurant is closed today' })
                                                : isBookingPastHoursToday
                                                    ? t('landing.booking.form.restaurant_past_hours_on_day', {
                                                        day: closedBookingWeekdayLabel,
                                                        defaultValue: `Restaurant has passed booking hours for ${closedBookingWeekdayLabel}`,
                                                    })
                                                    : !selectableTimeBounds
                                                        ? t('landing.booking.form.no_slots')
                                                        : t('landing.booking.form.choose_table')}
                                        </span>
                                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                    </button>
                                </form>

                                <div className="reservation-search-features mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {[
                                        { icon: 'restaurant', label: t('landing.booking.features.fine_dining.label'), desc: t('landing.booking.features.fine_dining.desc') },
                                        { icon: 'check_circle', label: t('landing.booking.features.instant_confirm.label'), desc: t('landing.booking.features.instant_confirm.desc') },
                                        { icon: 'local_parking', label: t('landing.booking.features.valet.label'), desc: t('landing.booking.features.valet.desc') }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group cursor-default rounded-xl px-2 py-1">
                                            <div className="w-12 h-12 rounded-full bg-[var(--primary-faint)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-[var(--on-primary)] transition-all duration-300 transform group-hover:scale-110">
                                                <span className="material-symbols-outlined text-[var(--primary)] group-hover:text-[var(--on-primary)]">{item.icon}</span>
                                            </div>
                                            <div>
                                                <span className="block text-sm font-bold text-[var(--text)]">{item.label}</span>
                                                <span className="block text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">{item.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === ReservationStep.TABLE_SELECTION && typeof document !== 'undefined' && createPortal(
                    <div className="reservation-table-overlay" role="dialog" aria-modal="true" aria-label={t('landing.booking.table_map.title')}>
                        <div className="reservation-table-overlay-panel fade-in">
                            <div className="reservation-table-shell reservation-table-shell-overlay w-full">
                                <div className="reservation-table-topbar flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 text-[var(--text-inverse)] px-1 sm:px-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <button onClick={() => setStep(ReservationStep.SEARCH)} className="flex items-center gap-2 text-[var(--text-inverse)] opacity-70 hover:opacity-100 group">
                                            <span className="material-symbols-outlined text-lg p-2 bg-white/10 rounded-full group-hover:bg-white/20">arrow_back</span>
                                            <span className="font-medium text-sm">{t('landing.booking.table_map.change_schedule')}</span>
                                        </button>
                                        <StepIndicator active={2} t={t} />
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <div className="text-[10px] opacity-60 uppercase tracking-widest font-bold mb-1">{t('landing.booking.table_map.reservation_for')}</div>
                                        <div className="text-sm font-bold flex flex-wrap items-center gap-2">
                                            <span>{new Date(booking.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            <span className="w-1 h-1 bg-[var(--text-inverse)] opacity-30 rounded-full" />
                                            <span>{booking.time}</span>
                                            <span className="w-1 h-1 bg-[var(--text-inverse)] opacity-30 rounded-full" />
                                            <span className="text-[var(--primary)]">{booking.guests} {t('landing.booking.table_map.guests')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="reservation-table-frame bg-[var(--card)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[76dvh] sm:h-[82dvh] lg:h-[85vh]">
                                    {/* Sidebar */}
                                    <div className="reservation-table-side-left hidden lg:flex w-80 bg-[var(--surface)] p-8 flex-col border-r border-[var(--border)]">
                                        <h3 className="text-2xl font-serif text-[var(--text)] mb-8 border-b border-[var(--border)] pb-4">{t('landing.booking.table_map.title')}</h3>

                                        <div className="space-y-5 mb-8">
                                            {[
                                                { bg: 'bg-[#f6ffed]', border: 'border-[#52c41a]', label: t('landing.booking.table_map.legend_available') },
                                                { bg: 'bg-[var(--primary-soft)]', border: 'border-[var(--primary)] shadow-md shadow-[var(--primary-glow)]', label: t('landing.booking.table_map.legend_selected') },
                                                { bg: 'bg-[#fff1f0]', border: 'border-[#ff4d4f] diagonal-stripe opacity-60', label: t('landing.booking.table_map.legend_occupied') }
                                            ].map((legend, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-lg border-2 ${legend.bg} ${legend.border}`} />
                                                    <span className="text-sm text-[var(--text-muted)] font-medium">{legend.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <div className="p-6 bg-gradient-to-br from-[var(--primary-faint)] to-[var(--card)] rounded-2xl border border-[var(--primary-border)] shadow-sm relative overflow-hidden">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="material-symbols-outlined text-[var(--primary)] text-base">auto_awesome</span>
                                                    <p className="text-[var(--primary-hover)] text-xs font-bold uppercase tracking-widest">{t('landing.booking.table_map.ai_assistant')}</p>
                                                </div>
                                                {isAiThinking ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-[var(--primary-soft)] rounded-full animate-bounce" />
                                                        <div className="w-2 h-2 bg-[var(--primary-soft)] rounded-full animate-bounce delay-100" />
                                                        <div className="w-2 h-2 bg-[var(--primary-soft)] rounded-full animate-bounce delay-200" />
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-[var(--text-muted)] italic leading-relaxed">&ldquo;{recommendation || t('landing.booking.table_map.ai_default')}&rdquo;</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floor Plan Canvas */}
                                    <div className="reservation-table-map-pane flex-1 relative bg-[var(--surface-subtle)] overflow-hidden p-0 min-h-[46dvh] lg:min-h-0">
                                        {isLayoutLoading && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--card)]/70 backdrop-blur-sm">
                                                <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                                                    <div className="mini-loader" />
                                                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">{t('landing.booking.table_map.loading')}</span>
                                                </div>
                                            </div>
                                        )}
                                        {layout ? (
                                            <div className="w-full h-full p-2 sm:p-4 lg:p-6">
                                                <TableMap2D
                                                    layout={layout}
                                                    onLayoutChange={setLayout}
                                                    onTableClick={handleMapTableClick}
                                                    onTablePositionChange={() => undefined}
                                                    readOnly
                                                    selectedTableIds={selectedTables.map(t => t.id)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
                                                {t('landing.booking.table_map.no_map')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Summary Panel */}
                                    <div className="reservation-table-side-right hidden lg:flex w-80 bg-[var(--card)] p-10 flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
                                        <h3 className="text-2xl font-serif text-[var(--text)] mb-8 border-b border-[var(--border)] pb-5">{t('landing.booking.table_map.booking_title')}</h3>

                                        <div className="flex-1 space-y-6">
                                            {selectedTables.length > 0 ? (
                                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text-muted)] flex items-center justify-between gap-4">
                                                        <span className="uppercase tracking-[0.2em] font-semibold">{t('landing.booking.table_map.total_capacity')}</span>
                                                        <span className="inline-flex items-center justify-center text-[var(--primary)] font-bold text-sm px-3 py-1 rounded-full bg-[var(--primary-faint)] border border-[var(--primary-border)] leading-none text-center whitespace-nowrap min-h-[28px]">
                                                            {totalSelectedCapacity} {t('landing.booking.table_map.guests')}
                                                        </span>
                                                    </div>
                                                    {selectedTables.map(table => (
                                                        <div key={table.id} className="bg-[var(--primary-faint)] rounded-2xl p-6 border border-[var(--primary-border)]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('landing.booking.table_map.selected_table_label')}</span>
                                                                <span className="text-2xl font-bold text-[var(--primary)] leading-none">{table.label}</span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-[var(--text-muted)]">{t('landing.booking.table_map.floor')}</span>
                                                                    <span className="font-semibold px-2.5 py-1 rounded-lg text-[11px] uppercase tracking-wider bg-[var(--surface-subtle)] text-[var(--text)]">
                                                                        {table.zone}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-[var(--text-muted)]">{t('landing.booking.table_map.capacity')}</span>
                                                                    <span className="font-semibold text-[var(--text)]">{table.capacity} {t('landing.booking.table_map.guests')}</span>
                                                                </div>
                                                            </div>
                                                            {panoramaMap.has(table.id) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openPanoramaPreview(table)}
                                                                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
                                                                    style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
                                                                >
                                                                    <span className="material-symbols-outlined text-base">3d_rotation</span>
                                                                    {t('landing.booking.table_map.view_360')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="reservation-empty-warning">
                                                    <span className="material-symbols-outlined">info</span>
                                                    <span>{t('landing.booking.table_map.no_table_selected')}</span>
                                                </div>
                                            )}

                                        </div>

                                        <button
                                            disabled={selectedTables.length === 0}
                                            onClick={handleConfirmTableSelection}
                                            className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0
                    ${selectedTables.length > 0 ? 'bg-[var(--primary)] hover:brightness-110 text-[var(--on-primary)] shadow-[0_4px_14px_0_var(--primary-glow)]' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-not-allowed'}
                  `}
                                        >
                                            {t('landing.booking.table_map.confirm_table')}
                                        </button>
                                    </div>

                                    {/* Mobile Sticky Footer */}
                                    <div className="reservation-table-mobile-footer lg:hidden p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-[var(--card)] border-t border-[var(--border)] flex flex-col gap-3">
                                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t('landing.booking.table_map.mobile_selected')}</p>
                                                <p className="font-bold text-[var(--text)] max-w-[70vw] sm:max-w-[56vw] truncate">
                                                    {selectedTables.length > 0
                                                        ? mobileSelectedTableSummary
                                                        : t('landing.booking.table_map.mobile_none')}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {t('landing.booking.table_map.total_capacity')}: {totalSelectedCapacity} {t('landing.booking.table_map.guests')}
                                                </p>
                                            </div>
                                            <div className="flex w-full sm:w-auto items-center gap-2">
                                                {mobilePanoramaTable && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openPanoramaPreview(mobilePanoramaTable)}
                                                        className="flex-1 sm:flex-none px-4 py-2 border border-[var(--primary-border)] text-[var(--primary)] rounded-xl font-bold text-xs"
                                                    >
                                                        {t('landing.booking.table_map.view_360')}
                                                    </button>
                                                )}
                                                <button
                                                    disabled={selectedTables.length === 0}
                                                    onClick={handleConfirmTableSelection}
                                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-[var(--primary)] text-[var(--on-primary)] rounded-xl font-bold text-sm disabled:opacity-50"
                                                >
                                                    {t('landing.booking.table_map.mobile_confirm')}
                                                </button>
                                            </div>
                                        </div>

                                        {selectedTables.length > 0 && (
                                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                {selectedTables.map((table) => (
                                                    <button
                                                        key={`mobile-chip-${table.id}`}
                                                        type="button"
                                                        onClick={() => panoramaMap.has(table.id) && openPanoramaPreview(table)}
                                                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${panoramaMap.has(table.id)
                                                            ? 'bg-[var(--primary-faint)] text-[var(--primary)] border-[var(--primary-border)]'
                                                            : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]'
                                                            }`}
                                                    >
                                                        #{table.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {step === ReservationStep.CONFIRMATION && typeof document !== 'undefined' && createPortal(
                    <div className="reservation-table-overlay reservation-flow-overlay" role="dialog" aria-modal="true" aria-label={t('landing.booking.confirm.title')}>
                        <div className="reservation-flow-overlay-panel reservation-confirm-overlay-panel fade-in">
                            <div className="reservation-confirm-shell w-full max-w-5xl">
                                {/* Back button + Step indicator */}
                                {/* Back button + Step indicator (Desktop) */}
                                <div className="reservation-confirm-back hidden md:flex items-center justify-between gap-3 mb-4 sm:mb-5 px-2">
                                    <button
                                        onClick={() => setStep(ReservationStep.TABLE_SELECTION)}
                                        className="flex items-center gap-2 text-[var(--text-inverse)] opacity-70 hover:opacity-100 group transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-lg p-2 bg-white/10 rounded-full group-hover:bg-white/20">arrow_back</span>
                                        <span className="font-medium text-sm">{t('landing.booking.confirm.change_table')}</span>
                                    </button>
                                    <StepIndicator active={3} t={t} />
                                </div>

                                <div className="reservation-confirm-card bg-[var(--card)] rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-0 md:min-h-[520px] relative isolate">
                                    {/* Left Summary Panel */}
                                    <div className="reservation-confirm-side-left md:w-[32%] bg-black text-white p-4 sm:p-5 md:p-7 flex flex-col relative overflow-hidden shrink-0 rounded-t-2xl md:rounded-t-none md:rounded-l-[2.5rem]">
                                        <div className="absolute inset-0 bg-[var(--primary)] opacity-90 rounded-t-2xl md:rounded-t-none md:rounded-l-[2.5rem]" />
                                        <div className="absolute -top-10 -right-10 text-white opacity-10 hidden md:block">
                                            <span className="material-symbols-outlined text-[180px]">restaurant_menu</span>
                                        </div>

                                        <div className="reservation-confirm-side-content relative z-10 h-full flex flex-col">
                                            {/* Back button + Step indicator (Mobile) */}
                                            <div className="md:hidden flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/20">
                                                <button
                                                    onClick={() => setStep(ReservationStep.TABLE_SELECTION)}
                                                    className="flex items-center gap-1.5 text-white opacity-80 hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="material-symbols-outlined text-base p-1.5 bg-white/10 rounded-full">arrow_back</span>
                                                    <span className="font-medium text-[11px]">{t('landing.booking.confirm.change_table')}</span>
                                                </button>
                                                <StepIndicator active={3} t={t} inverted />
                                            </div>

                                            <h2 className="reservation-confirm-title text-xl md:text-2xl font-serif mb-3 md:mb-5 border-b border-white/20 md:border-b-0 pb-2 md:pb-4 text-balance">{t('landing.booking.confirm.title')}</h2>

                                            <div className="reservation-confirm-metrics grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-6">
                                                {[
                                                    { icon: 'calendar_today', label: t('landing.booking.confirm.date_time'), value: new Date(booking.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), sub: booking.time },
                                                    { icon: 'table_restaurant', label: t('landing.booking.confirm.selected_table'), value: selectedTables.map(t => `#${t.label}`).join(', '), sub: `${Array.from(new Set(selectedTables.map(t => t.zone))).join(', ')}` },
                                                    { icon: 'group', label: t('landing.booking.confirm.party_size', { count: booking.guests }), value: `${booking.guests} ${t('landing.booking.table_map.guests')}`, sub: t('landing.booking.confirm.standard_seating') }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="reservation-confirm-metric-item flex flex-col md:flex-row gap-1.5 md:gap-4 md:items-center">
                                                        <div className="w-7 h-7 md:w-10 md:h-10 mb-1 md:mb-0 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                                                            <span className="material-symbols-outlined text-white text-[15px] md:text-xl">{item.icon}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-white/70 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5">{item.label}</p>
                                                            <p className="text-[13px] md:text-[0.98rem] font-bold text-pretty leading-snug">{item.value}</p>
                                                            <p className="text-white/80 text-[10px] md:text-xs">{item.sub}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="reservation-confirm-address mt-3 md:mt-auto pt-3 md:pt-5 border-t border-white/20">
                                                <div className="flex items-start gap-2 md:gap-3 opacity-80">
                                                    <span className="material-symbols-outlined text-[15px] md:text-base mt-0.5">location_on</span>
                                                    <p className="text-[11px] md:text-sm font-medium leading-relaxed text-pretty">
                                                        {tenant?.businessAddressLine1 || '—'}{tenant?.businessAddressLine2 ? `, ${tenant?.businessAddressLine2}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Form Panel */}
                                    <div className="reservation-confirm-side-right md:w-[68%] p-4 sm:p-6 md:p-8 bg-[var(--card)] rounded-b-2xl md:rounded-b-none md:rounded-r-[2.5rem]">
                                        <div className="mb-4 md:mb-5">
                                            <h3 className="text-xl md:text-[1.65rem] font-serif text-[var(--text)] mb-1 md:mb-2 text-balance">{t('landing.booking.confirm.finalize_title')}</h3>
                                            <p className="text-[12px] md:text-sm text-[var(--text-muted)] font-medium text-pretty">{t('landing.booking.confirm.finalize_desc')}</p>
                                            {user && (
                                                <div className="mt-2 flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-[var(--primary)] font-semibold">
                                                    <span className="material-symbols-outlined text-sm">verified_user</span>
                                                    <span>{t('landing.booking.confirm.logged_in_hint', { name: user.name || user.fullName || user.email })}</span>
                                                </div>
                                            )}
                                        </div>

                                        <form className="reservation-confirm-form flex flex-col gap-3 md:gap-4">
                                            <div className="reservation-confirm-grid grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                                                <div className="group">
                                                    <label className="block text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] mb-1.5 md:mb-2 uppercase tracking-widest">{t('landing.booking.confirm.full_name')}</label>
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-3 md:left-3.5 top-2.5 md:top-3 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors text-[18px] md:text-[24px]">person</span>
                                                        <input
                                                            type="text"
                                                            className="reservation-confirm-input w-full pl-9 md:pl-11 pr-3 py-2.5 md:py-3 rounded-lg border border-[var(--border)] bg-transparent md:bg-[var(--surface-subtle)] text-sm focus:bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all outline-none"
                                                            value={userDetails.name}
                                                            onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] mb-1.5 md:mb-2 uppercase tracking-widest">{t('landing.booking.confirm.phone_number')}</label>
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-3 md:left-3.5 top-2.5 md:top-3 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors text-[18px] md:text-[24px]">call</span>
                                                        <input
                                                            type="tel"
                                                            className="reservation-confirm-input w-full pl-9 md:pl-11 pr-3 py-2.5 md:py-3 rounded-lg border border-[var(--border)] bg-transparent md:bg-[var(--surface-subtle)] text-sm focus:bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all outline-none"
                                                            value={userDetails.phone}
                                                            onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] mb-1.5 md:mb-2 uppercase tracking-widest">{t('landing.booking.confirm.email')}</label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 md:left-3.5 top-2.5 md:top-3 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors text-[18px] md:text-[24px]">mail</span>
                                                    <input
                                                        type="email"
                                                        className="reservation-confirm-input w-full pl-9 md:pl-11 pr-3 py-2.5 md:py-3 rounded-lg border border-[var(--border)] bg-transparent md:bg-[var(--surface-subtle)] text-sm focus:bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all outline-none"
                                                        value={userDetails.email}
                                                        onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] mb-1.5 md:mb-2 uppercase tracking-widest">{t('landing.booking.confirm.special_requests')} <span className="text-[var(--text-muted)] font-normal ml-1">{t('landing.booking.confirm.special_requests_optional')}</span></label>
                                                <textarea
                                                    className="reservation-confirm-textarea w-full p-3 md:p-3.5 rounded-lg border border-[var(--border)] bg-transparent md:bg-[var(--surface-subtle)] text-sm focus:bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all outline-none resize-none h-20 md:h-24"
                                                    value={userDetails.requests}
                                                    onChange={(e) => setUserDetails({ ...userDetails, requests: e.target.value })}
                                                />
                                            </div>

                                            <div className="pt-2 sm:pt-3">
                                                {submitError && (
                                                    <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[18px] md:text-lg">error</span>
                                                        {submitError}
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={handleCompleteReservation}
                                                    disabled={isSubmitting}
                                                    className="reservation-confirm-submit w-full py-3 md:py-3.5 bg-[var(--primary)] hover:brightness-110 text-[var(--on-primary)] font-bold text-sm sm:text-base rounded-xl shadow-[0_4px_14px_0_var(--primary-glow)] transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-2.5 group"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            <span>{t('landing.booking.confirm.processing')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{t('landing.booking.confirm.complete_btn')}</span>
                                                            <span className="material-symbols-outlined text-[18px] md:text-[24px] group-hover:translate-x-1 transition-transform">check_circle</span>
                                                        </>
                                                    )}
                                                </button>
                                                <p className="text-center text-[9px] md:text-[10px] text-[var(--text-muted)] mt-3 md:mt-4 leading-relaxed">
                                                    {t('landing.booking.confirm.terms').replace('<a>', '').replace('</a>', '')}
                                                </p>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {step === ReservationStep.SUCCESS && typeof document !== 'undefined' && createPortal(
                    <div className="reservation-table-overlay reservation-flow-overlay" role="dialog" aria-modal="true" aria-label={t('landing.booking.success.title')}>
                        <div
                            className="reservation-flow-overlay-backdrop absolute inset-0 transition-opacity"
                            onClick={() => {
                                setStep(ReservationStep.SEARCH);
                                setBooking(prev => ({ ...prev, time: '' }));
                                setSelectedTables([]);
                            }}
                        />
                        <div className="reservation-flow-overlay-panel reservation-success-overlay-panel fade-in relative pointer-events-auto">
                            <div className="reservation-success-shell max-w-lg w-full text-center bg-[var(--card)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
                                {/* Close Button */}
                                <button
                                    onClick={() => {
                                        setStep(ReservationStep.SEARCH);
                                        setBooking(prev => ({ ...prev, time: '' }));
                                        setSelectedTables([]);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors z-10"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>

                                {/* Green top accent */}
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--success)]" />

                                {/* Success icon */}
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--success-soft)] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                                    <span className="material-symbols-outlined text-[var(--success)] text-3xl sm:text-4xl">verified</span>
                                </div>

                                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text)] mb-2 text-balance">{t('landing.booking.success.title')}</h2>
                                <p className="text-[var(--text-muted)] text-sm mb-4 sm:mb-6 leading-relaxed px-1 sm:px-2 text-pretty">
                                    {t('landing.booking.success.thank_you')}{' '}
                                    <span className="text-[var(--text)] font-semibold">{userDetails.name}</span>.{' '}
                                    {t('landing.booking.success.table_label')}{' '}
                                    <span className="text-[var(--primary)] font-bold">
                                        {selectedTables.length > 0 ? selectedTables.map(t => `#${t.label}`).join(', ') : ''}
                                    </span>
                                    {selectedTables.length > 0 ? ` (${Array.from(new Set(selectedTables.map(t => t.zone))).join(', ')})` : ''} {t('landing.booking.success.reserved_for')}{' '}
                                    <span className="text-[var(--text)] font-semibold">
                                        {booking.guests} {t('landing.booking.success.guests')}
                                    </span>{' '}
                                    {t('landing.booking.success.on')}{' '}
                                    <span className="text-[var(--text)] font-semibold">
                                        {new Date(booking.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>{' '}
                                    {t('landing.booking.success.at')}{' '}
                                    <span className="text-[var(--text)] font-semibold">{booking.time}</span>.
                                </p>

                                {/* Info block */}
                                <div className="bg-[var(--surface)] rounded-2xl p-3.5 sm:p-4 mb-5 sm:mb-6 text-left border border-[var(--border)] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-bold">{t('landing.booking.success.booking_ref')}</span>
                                        <span className="text-sm font-bold text-[var(--primary)] font-mono tracking-wider">
                                            #{confirmationCode || reservationId || '---'}
                                        </span>
                                    </div>
                                    <div className="h-px bg-[var(--border)]" />

                                    <div className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                                        <span className="material-symbols-outlined text-base text-[var(--text-muted)] mt-0.5">mail</span>
                                        <div className="min-w-0">
                                            <div className="text-xs uppercase tracking-wide">{t('landing.booking.success.confirmation_sent', { defaultValue: 'Email xác nhận gửi tới:' })}</div>
                                            <div className="text-[var(--text)] font-medium break-all">{userDetails.email || '—'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                                        <span className="material-symbols-outlined text-base text-[var(--text-muted)] mt-0.5">phone</span>
                                        <div className="min-w-0">
                                            <div className="text-xs uppercase tracking-wide">{t('landing.booking.success.phone_label', { defaultValue: 'Phone' })}</div>
                                            <div className="text-[var(--text)] font-medium">{userDetails.phone || '—'}</div>
                                        </div>
                                    </div>
                                </div>

                                {depositCheckoutUrl && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => {
                                                window.location.href = depositCheckoutUrl;
                                            }}
                                            className="w-full py-3.5 mb-2 bg-[var(--success)] hover:brightness-110 text-white font-bold rounded-xl transition-all text-sm sm:text-base"
                                        >
                                            {t('landing.booking.success.pay_deposit_now', { defaultValue: 'Thanh toán cọc ngay' })}
                                        </button>
                                        {depositPaymentDeadline && (
                                            <p className="text-xs text-[var(--danger)] text-center">
                                                {t('landing.booking.success.deposit_deadline', { defaultValue: 'Hạn thanh toán cọc' })}: {new Date(depositPaymentDeadline).toLocaleString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        const detailToken = (confirmationCode || reservationId || '').trim();
                                        if (!detailToken) return;
                                        window.location.href = `/your-reservation/${encodeURIComponent(detailToken)}`;
                                    }}
                                    disabled={!confirmationCode && !reservationId}
                                    className="w-full py-3.5 border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] font-bold rounded-xl transition-all text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {t('landing.booking.success.view_details', { defaultValue: 'Xem chi tiết' })}
                                </button>
                            </div>
                        </div>
                    </div>
                    ,
                    document.body
                )}

            </main>


            <TablePreview3DModal
                open={is3DModalOpen}
                table={panoramaTableData}
                tableImageUrl={active360TableId ? panoramaMap.get(active360TableId)?.imageUrl : undefined}
                onClose={() => setIs3DModalOpen(false)}
                onBookNow={() => {
                    setIs3DModalOpen(false);
                    setStep(ReservationStep.CONFIRMATION);
                }}
                onBackToMap={() => {
                    setIs3DModalOpen(false);
                }}
            />


            {/* Footer Branding */}
            <footer className="relative z-10 py-10 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-[var(--primary)] text-2xl font-serif font-bold italic tracking-widest">{tenant?.businessName || tenant?.name || t('restaurant.header.title')}</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: '#ffffff' }}>{t('landing.booking.footer.tagline')}</p>
            </footer>
        </div>
    );
};

export default ReservationSection;
