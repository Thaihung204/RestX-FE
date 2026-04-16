'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ReservationStep, BookingData, Table, UserDetails } from './types';
import { TenantConfig } from '@/lib/services/tenantService';
import { tableService, floorService, TableStatus, FloorLayoutTableItem } from '@/lib/services/tableService';
import reservationService from '@/lib/services/reservationService';
import { TableMap2D, Layout } from '@/app/admin/tables/components/TableMap2D';
import { TableData } from '@/app/admin/tables/components/DraggableTable';
import TablePreview3DModal from './TablePreview3DModal';

import { DatePicker, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/contexts/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// ─────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────

const DEFAULT_TIME_SLOTS = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
const DEFAULT_SLOT_INTERVAL_MINUTES = 30;



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

    const openingHours = parseOpeningHours(tenant?.businessOpeningHours);
    if (openingHours) {
        const generatedSlots = buildTimeSlotsFromHours(openingHours.open, openingHours.close);
        if (generatedSlots.length) timeSlots = generatedSlots;
    }

    const settings = (tenant as any)?.tenantSettings ?? [];
    if (Array.isArray(settings)) {
        for (const raw of settings) {
            const key = (raw?.key ?? raw?.Key ?? '').toString();
            const value = (raw?.value ?? raw?.Value ?? '').toString();
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
        }
    }

    return { timeSlots, maxGuestsOverride };
};

interface ReservationSectionProps {
    tenant: TenantConfig | null;
}

const StepIndicator: React.FC<{ active: number; t: (key: string, options?: any) => string }> = ({ active, t }) => (
    <div className="flex items-center gap-3 justify-center mb-8">
        {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${active === s ? 'text-[var(--text-inverse)]' : 'text-[var(--text-inverse)] opacity-40'}`}>
                    <span
                        className={`w-8 h-8 rounded-full grid place-items-center text-sm font-serif border-2 leading-none`}
                        style={{
                            backgroundColor: active === s ? 'var(--primary)' : 'transparent',
                            borderColor: active === s ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                            boxShadow: active === s ? '0 0 15px var(--primary-glow)' : 'none',
                            lineHeight: 1,
                        }}
                    >
                        {s}
                    </span>
                    <span className={`text-xs uppercase tracking-widest hidden sm:inline ${active === s ? 'font-bold' : 'font-medium'}`}>
                        {s === 1 ? t('landing.booking.step.schedule') : s === 2 ? t('landing.booking.step.location') : t('landing.booking.step.confirm')}
                    </span>
                </div>
                {s < 3 && <div className="w-8 md:w-16 h-px bg-[var(--text-inverse)] opacity-20" />}
            </React.Fragment>
        ))}
    </div>
);

const ReservationSection: React.FC<ReservationSectionProps> = ({ tenant }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [step, setStep] = useState<ReservationStep>(ReservationStep.SEARCH);
    const autoFilledRef = useRef(false);

    const { timeSlots } = useMemo(
        () => getTenantReservationConfig(tenant),
        [tenant],
    );

    const getTodayLocalDate = () => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
    };

    const [booking, setBooking] = useState<BookingData>({
        date: getTodayLocalDate(),
        time: '19:00',
        guests: 4
    });

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

    const totalSelectedCapacity = useMemo(
        () => selectedTables.reduce((sum, table) => sum + (table.capacity || 0), 0),
        [selectedTables],
    );


    useEffect(() => {
        const today = getTodayLocalDate();
        const currentDate = booking.date < today ? today : booking.date;

        const availableSlots = timeSlots.filter((slot) => {
            if (currentDate !== today) return true;

            const [h, m] = slot.split(':').map(Number);
            const slotDate = new Date();
            slotDate.setHours(h, m, 0, 0);
            return slotDate.getTime() > Date.now();
        });

        const nextTime = availableSlots.includes(booking.time)
            ? booking.time
            : (availableSlots[0] || timeSlots[0]);

        if (currentDate !== booking.date || nextTime !== booking.time) {
            setBooking(prev => ({ ...prev, date: currentDate, time: nextTime }));
        }
    }, [booking.date, booking.time]);

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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getSmartRecommendation(booking.guests, booking.time);
        setStep(ReservationStep.TABLE_SELECTION);
    };


    // The old inline THREE.js panorama viewer has been replaced by TablePreview3DModal

    const handleCompleteReservation = async () => {
        if (selectedTables.length === 0) return;

        // Basic validation
        if (!userDetails.name || !userDetails.phone || !userDetails.email) {
            setSubmitError(t('landing.booking.confirm.error_required'));
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
                numberOfGuests: booking.guests,
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

    return (
        <div id="reservation" className="min-h-screen relative text-[var(--text)]">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfPFwjLEKDFOt-mxPmzwYjzNLMEX3sT58UZGugJPCINRcDIw57-nX-MzWGzA5TyIMujN9sgVaAduJDds0CehlPSOV-sM1tcFsO5HkoObZMdVizGg68w6Z4wUrxxLYQh6j5_BJuPKL0ZWsABXLDlqrbMZcBCLWqecFrgUf0o_7_6X-peTbMorUQvBLZ3mdERB9kTTwNVnaNz11aTT9BQgKfyyGn7Wa_avn--DQijsUy8CG2lp80Pbia-cQMT8ekuG3rPRmDB3oR3xs"
                    alt="Restaurant Ambiance"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>

            <main className={`relative z-10 mx-auto px-4 py-8 md:py-20 min-h-screen flex flex-col items-center justify-center ${step === ReservationStep.TABLE_SELECTION ? 'w-full max-w-[98vw]' : 'container'}`}>

                {/* Language Switcher — top right corner */}
                <div className="absolute top-4 right-4 z-20">
                    <LanguageSwitcher
                        style={{
                            color: 'white',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(8px)',
                        }}
                    />
                </div>

                {step === ReservationStep.SEARCH && (
                    <div className="w-full max-w-5xl fade-in">
                        <div className="text-center mb-12">
                            <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--primary-border)] bg-black/30 backdrop-blur-md text-[var(--primary)] text-xs font-bold tracking-[0.2em] uppercase mb-6 shadow-xl">
                                {t('landing.booking.hero.badge')}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-serif" style={{ color: 'var(--text-inverse)' }}>
                                {t('landing.booking.hero.title_prefix')} <br />
                                <span style={{ color: 'var(--primary)' }}>
                                    {t('landing.booking.hero.title_highlight')}
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                                {t('landing.booking.hero.description')}
                            </p>
                        </div>

                        <div className="bg-[var(--card)] rounded-[2rem] shadow-2xl p-6 md:p-10 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--primary-soft)] to-[var(--primary)]"></div>

                            <form onSubmit={handleSearchSubmit} className="reservation-pill">
                                <div className="pill-segment">
                                    <span className="pill-label">{t('landing.booking.form.arrival_date')}</span>
                                        <DatePicker
                                        className="reservation-date-picker pill-control"
                                        classNames={{ popup: { root: 'reservation-date-popup' } }}
                                            value={dayjs(booking.date, 'YYYY-MM-DD')}
                                            format="DD/MM/YYYY"
                                            allowClear={false}
                                            suffixIcon={<span className="material-symbols-outlined text-[var(--text-muted)]">calendar_month</span>}
                                            prefix={<span className="material-symbols-outlined text-[var(--primary)]">calendar_month</span>}
                                            disabledDate={(current) => {
                                                if (!current) return false;
                                                // Disable past days
                                                if (current.startOf('day').isBefore(dayjs().startOf('day'))) return true;
                                                // Disable today if all time slots have already passed
                                                if (current.startOf('day').isSame(dayjs().startOf('day'))) {
                                                    const hasAvailableSlot = timeSlots.some((slot) => {
                                                        const [h, m] = slot.split(':').map(Number);
                                                        const slotDate = new Date();
                                                        slotDate.setHours(h, m, 0, 0);
                                                        return slotDate.getTime() > Date.now();
                                                    });
                                                    return !hasAvailableSlot;
                                                }
                                                return false;
                                            }}
                                            onChange={(value) => {
                                                if (!value) return;
                                                const selectedDate = value.format('YYYY-MM-DD');
                                                const today = getTodayLocalDate();
                                                const safeDate = selectedDate < today ? today : selectedDate;
                                                setBooking({ ...booking, date: safeDate });
                                            }}
                                        />
                                </div>

                                <div className="pill-divider" />

                                <div className="pill-segment">
                                    <span className="pill-label">{t('landing.booking.form.preferred_time')}</span>
                                    <TimePicker
                                        className="reservation-time-select pill-control"
                                        classNames={{ popup: { root: 'reservation-time-popup' } }}
                                        value={dayjs(booking.time, 'HH:mm')}
                                        format="HH:mm"
                                        minuteStep={5}
                                        allowClear={false}
                                        showNow={false}
                                        suffixIcon={<span className="material-symbols-outlined text-[var(--text-muted)]">expand_more</span>}
                                        onChange={(value) => {
                                            if (!value) return;
                                            setBooking({ ...booking, time: value.format('HH:mm') });
                                        }}
                                        disabledTime={() => {
                                            const today = getTodayLocalDate();
                                            if (booking.date !== today) return {};

                                            const now = dayjs();
                                            const currentHour = now.hour();
                                            const currentMinute = now.minute();

                                            return {
                                                disabledHours: () => Array.from({ length: currentHour }, (_, i) => i),
                                                disabledMinutes: (selectedHour: number) => {
                                                    if (selectedHour !== currentHour) return [];
                                                    return Array.from({ length: currentMinute + 1 }, (_, i) => i);
                                                },
                                            };
                                        }}
                                    />
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
                                            onClick={() => setBooking(b => ({ ...b, guests: Math.max(1, b.guests - 1) }))}
                                                className="pill-step-btn"
                                        >
                                            −
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBooking(b => ({ ...b, guests: b.guests + 1 }))}
                                                className="pill-step-btn"
                                        >
                                            +
                                        </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={(() => {
                                        const today = getTodayLocalDate();
                                        const available = timeSlots.filter((slot) => {
                                            if (booking.date !== today) return true;
                                            const [h, m] = slot.split(':').map(Number);
                                            const slotDate = new Date();
                                            slotDate.setHours(h, m, 0, 0);
                                            return slotDate.getTime() > Date.now();
                                        });
                                        return available.length === 0;
                                    })()}
                                    className="pill-submit disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    <span>{t('landing.booking.form.choose_table')}</span>
                                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                </button>
                            </form>

                            <div className="mt-10 pt-8 border-t border-[var(--border)] flex flex-wrap justify-between gap-6">
                                {[
                                    { icon: 'restaurant', label: t('landing.booking.features.fine_dining.label'), desc: t('landing.booking.features.fine_dining.desc') },
                                    { icon: 'check_circle', label: t('landing.booking.features.instant_confirm.label'), desc: t('landing.booking.features.instant_confirm.desc') },
                                    { icon: 'local_parking', label: t('landing.booking.features.valet.label'), desc: t('landing.booking.features.valet.desc') }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group cursor-default">
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
                )}

                {step === ReservationStep.TABLE_SELECTION && (
                    <div className="w-full fade-in">
                        <StepIndicator active={2} t={t} />

                        <div className="flex justify-between items-center mb-6 text-[var(--text-inverse)] px-2">
                            <button onClick={() => setStep(ReservationStep.SEARCH)} className="flex items-center gap-2 text-[var(--text-inverse)] opacity-70 hover:opacity-100 group">
                                <span className="material-symbols-outlined text-lg p-2 bg-white/10 rounded-full group-hover:bg-white/20">arrow_back</span>
                                <span className="font-medium text-sm">{t('landing.booking.table_map.change_schedule')}</span>
                            </button>
                            <div className="text-right">
                                <div className="text-[10px] opacity-60 uppercase tracking-widest font-bold mb-1">{t('landing.booking.table_map.reservation_for')}</div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                    <span>{new Date(booking.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    <span className="w-1 h-1 bg-[var(--text-inverse)] opacity-30 rounded-full" />
                                    <span>{booking.time}</span>
                                    <span className="w-1 h-1 bg-[var(--text-inverse)] opacity-30 rounded-full" />
                                    <span className="text-[var(--primary)]">{booking.guests} {t('landing.booking.table_map.guests')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--card)] rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[85vh]">
                            {/* Sidebar */}
                            <div className="hidden lg:flex w-80 bg-[var(--surface)] p-8 flex-col border-r border-[var(--border)]">
                                <h3 className="text-2xl font-serif text-[var(--text)] mb-8 border-b border-[var(--border)] pb-4">{t('landing.booking.table_map.title')}</h3>

                                <div className="space-y-5 mb-8">
                                    {[
                                        { bg: 'bg-[#f6ffed]', border: 'border-[#52c41a]', label: 'Available' },
                                        { bg: 'bg-[var(--primary-soft)]', border: 'border-[var(--primary)] shadow-md shadow-[var(--primary-glow)]', label: 'Selected' },
                                        { bg: 'bg-[#fff1f0]', border: 'border-[#ff4d4f] diagonal-stripe opacity-60', label: 'Occupied' }
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
                            <div className="flex-1 relative bg-[var(--surface-subtle)] overflow-auto p-0">
                                {isLayoutLoading && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--card)]/70 backdrop-blur-sm">
                                        <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                                            <div className="mini-loader" />
                                            <span className="text-xs font-semibold uppercase tracking-[0.2em]">{t('landing.booking.table_map.loading', 'Đang tải sơ đồ...')}</span>
                                        </div>
                                    </div>
                                )}
                                {layout ? (
                                    <div className="w-full h-full p-6">
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
                            <div className="hidden lg:flex w-80 bg-[var(--card)] p-10 flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
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
                                                            onClick={() => {
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
                                                            }}
                                                            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
                                                            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
                                                        >
                                                            <span className="material-symbols-outlined text-base">3d_rotation</span>
                                                            {t('landing.booking.table_map.view_360', 'Xem 360')}
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
                                    onClick={() => setStep(ReservationStep.CONFIRMATION)}
                                    className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0
                    ${selectedTables.length > 0 ? 'bg-[var(--primary)] hover:brightness-110 text-[var(--on-primary)] shadow-[0_4px_14px_0_var(--primary-glow)]' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-not-allowed'}
                  `}
                                >
                                    {t('landing.booking.table_map.confirm_table')}
                                </button>
                            </div>

                            {/* Mobile Sticky Footer */}
                            <div className="lg:hidden p-4 bg-[var(--card)] border-t border-[var(--border)] flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t('landing.booking.table_map.mobile_selected')}</p>
                                    <p className="font-bold text-[var(--text)]">{selectedTables.length > 0 ? `Selected ${selectedTables.length} tables` : t('landing.booking.table_map.mobile_none')}</p>
                                </div>
                                <button
                                    disabled={selectedTables.length === 0}
                                    onClick={() => setStep(ReservationStep.CONFIRMATION)}
                                    className="px-8 py-3 bg-[var(--primary)] text-[var(--on-primary)] rounded-xl font-bold text-sm disabled:opacity-50"
                                >
                                    {t('landing.booking.table_map.mobile_confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === ReservationStep.CONFIRMATION && (
                    <div className="w-full max-w-5xl fade-in">
                        <StepIndicator active={3} t={t} />

                        {/* Back button */}
                        <div className="mb-6 px-2">
                            <button
                                onClick={() => setStep(ReservationStep.TABLE_SELECTION)}
                                className="flex items-center gap-2 text-[var(--text-inverse)] opacity-70 hover:opacity-100 group transition-opacity"
                            >
                                <span className="material-symbols-outlined text-lg p-2 bg-white/10 rounded-full group-hover:bg-white/20">arrow_back</span>
                                <span className="font-medium text-sm">{t('landing.booking.confirm.change_table')}</span>
                            </button>
                        </div>

                        <div className="bg-[var(--card)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[560px]">
                            {/* Left Summary Panel */}
                            <div className="md:w-[35%] bg-black text-white p-10 flex flex-col relative overflow-hidden">
                                <div className="absolute inset-0 bg-[var(--primary)] opacity-90" />
                                <div className="absolute -top-10 -right-10 text-white opacity-10">
                                    <span className="material-symbols-outlined text-[180px]">restaurant_menu</span>
                                </div>

                                <div className="relative z-10 h-full flex flex-col">
                                    <h2 className="text-4xl font-serif mb-10 border-b border-white/20 pb-5">{t('landing.booking.confirm.title')}</h2>

                                    <div className="space-y-10 flex-1">
                                        {[
                                            { icon: 'calendar_today', label: t('landing.booking.confirm.date_time'), value: new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), sub: booking.time },
                                            { icon: 'table_restaurant', label: t('landing.booking.confirm.selected_table'), value: selectedTables.map(t => `Table ${t.label}`).join(', '), sub: `${Array.from(new Set(selectedTables.map(t => t.zone))).join(', ')}` },
                                            { icon: 'group', label: t('landing.booking.confirm.party_size'), value: `${booking.guests} ${t('landing.booking.table_map.guests')}`, sub: t('landing.booking.confirm.standard_seating') }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                                                    <span className="material-symbols-outlined text-white">{item.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</p>
                                                    <p className="text-lg font-bold">{item.value}</p>
                                                    <p className="text-white/80 text-sm">{item.sub}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-white/20">
                                        <div className="flex items-start gap-4 opacity-70">
                                            <span className="material-symbols-outlined text-lg mt-1">location_on</span>
                                            <p className="text-sm font-medium leading-relaxed">
                                                {tenant?.businessAddressLine1 || '—'}<br />
                                                {tenant?.businessAddressLine2 || ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Form Panel */}
                            <div className="md:w-[65%] p-10 md:p-14 bg-[var(--card)]">
                                <div className="mb-10">
                                    <h3 className="text-3xl font-serif text-[var(--text)] mb-3">{t('landing.booking.confirm.finalize_title')}</h3>
                                    <p className="text-[var(--text-muted)] font-medium">{t('landing.booking.confirm.finalize_desc')}</p>
                                    {user && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--primary)] font-semibold">
                                            <span className="material-symbols-outlined text-sm">verified_user</span>
                                            <span>{t('landing.booking.confirm.logged_in_hint', { name: user.name || user.fullName || user.email })}</span>
                                        </div>
                                    )}
                                </div>

                                <form className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="group">
                                            <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">{t('landing.booking.confirm.full_name')}</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">person</span>
                                                <input
                                                    type="text"
                                                    placeholder={t('landing.booking.confirm.name_placeholder')}
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--card)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                                                    value={userDetails.name}
                                                    onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">{t('landing.booking.confirm.phone_number')}</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">call</span>
                                                <input
                                                    type="tel"
                                                    placeholder={t('landing.booking.confirm.phone_placeholder')}
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--card)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                                                    value={userDetails.phone}
                                                    onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">{t('landing.booking.confirm.email')}</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">mail</span>
                                            <input
                                                type="email"
                                                placeholder={t('landing.booking.confirm.email_placeholder')}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--card)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                                                value={userDetails.email}
                                                onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">{t('landing.booking.confirm.special_requests')} <span className="text-[var(--text-muted)] font-normal ml-1">{t('landing.booking.confirm.special_requests_optional')}</span></label>
                                        <textarea
                                            placeholder={t('landing.booking.confirm.requests_placeholder')}
                                            className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--card)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none resize-none h-28"
                                            value={userDetails.requests}
                                            onChange={(e) => setUserDetails({ ...userDetails, requests: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-6">
                                        {submitError && (
                                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">error</span>
                                                {submitError}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleCompleteReservation}
                                            disabled={isSubmitting}
                                            className="w-full py-5 bg-[var(--primary)] hover:brightness-110 text-[var(--on-primary)] font-bold text-xl rounded-2xl shadow-xl shadow-[var(--primary-glow)] transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>{t('landing.booking.confirm.processing')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{t('landing.booking.confirm.complete_btn')}</span>
                                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">check_circle</span>
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-[10px] text-[var(--text-muted)] mt-6 leading-relaxed">
                                            {t('landing.booking.confirm.terms').replace('<a>', '').replace('</a>', '')}
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {step === ReservationStep.SUCCESS && (
                    <div className="max-w-md w-full fade-in text-center bg-[var(--card)] rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                        {/* Green top accent */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--success)]" />

                        {/* Success icon */}
                        <div className="w-20 h-20 bg-[var(--success-soft)] rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-[var(--success)] text-5xl">verified</span>
                        </div>

                        <h2 className="text-3xl font-serif font-bold text-[var(--text)] mb-3">{t('landing.booking.success.title')}</h2>
                        <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed px-2">
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
                        <div className="bg-[var(--surface)] rounded-2xl p-5 mb-8 text-left border border-[var(--border)] space-y-3">
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
                                    className="w-full py-3.5 mb-2 bg-[var(--success)] hover:brightness-110 text-white font-bold rounded-xl transition-all text-sm"
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
                                if (!reservationId) return;
                                window.location.href = `/your-reservation/${reservationId}`;
                            }}
                            disabled={!reservationId}
                            className="w-full py-3.5 border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] font-bold rounded-xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {t('landing.booking.success.view_details', { defaultValue: 'Xem chi tiết' })}
                        </button>
                    </div>
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

            <style jsx global>{`
                .reservation-date-picker.ant-picker {
                    width: 100% !important;
                    height: 54px !important;
                    min-height: 54px !important;
                    border-radius: 12px !important;
                    border: 1px solid var(--border) !important;
                    background: var(--surface) !important;
                    color: var(--text) !important;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
                    padding: 0 12px !important;
                    gap: 10px !important;
                }

                .reservation-empty-warning {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-radius: 16px;
                    border: 1px solid var(--warning-border);
                    background: var(--warning-soft);
                    padding: 12px 16px;
                    color: var(--warning);
                }

                .reservation-empty-warning .material-symbols-outlined {
                    font-size: 16px;
                }

                .reservation-empty-warning span:last-child {
                    font-weight: 600;
                }

                .reservation-date-picker .ant-picker-input > input {
                    color: var(--text) !important;
                    font-weight: 600 !important;
                }

                .reservation-date-picker.ant-picker-focused {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 22%, transparent) !important;
                }

                .reservation-date-popup {
                    z-index: 1200 !important;
                    background: var(--card) !important;
                    border: 1px solid var(--border) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
                }

                .reservation-date-popup .ant-picker-panel-container,
                .reservation-date-popup .ant-picker-panel,
                .reservation-date-popup .ant-picker-date-panel,
                .reservation-date-popup .ant-picker-content {
                    background: var(--card) !important;
                    color: var(--text) !important;
                }

                .reservation-date-popup .ant-picker-header,
                .reservation-date-popup .ant-picker-footer {
                    color: var(--text) !important;
                    border-color: var(--border) !important;
                }

                .reservation-date-popup .ant-picker-header button,
                .reservation-date-popup .ant-picker-header-view,
                .reservation-date-popup .ant-picker-content th,
                .reservation-date-popup .ant-picker-content td,
                .reservation-date-popup .ant-picker-cell .ant-picker-cell-inner,
                .reservation-date-popup .ant-picker-now-btn,
                .reservation-date-popup .ant-picker-today-btn {
                    color: var(--text) !important;
                }

                .reservation-date-popup .ant-picker-cell-disabled .ant-picker-cell-inner {
                    color: var(--text-muted) !important;
                    opacity: 0.45;
                }

                .reservation-date-popup .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
                    border-color: var(--primary) !important;
                }

                .reservation-date-popup .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner,
                .reservation-date-popup .ant-picker-cell-in-view.ant-picker-cell-range-start .ant-picker-cell-inner,
                .reservation-date-popup .ant-picker-cell-in-view.ant-picker-cell-range-end .ant-picker-cell-inner {
                    background: color-mix(in srgb, var(--primary) 24%, transparent) !important;
                    color: var(--text) !important;
                }

                .reservation-date-popup .ant-picker-cell:hover .ant-picker-cell-inner {
                    background: var(--surface-subtle) !important;
                }

                .reservation-pill {
                    display: flex;
                    align-items: stretch;
                    background: color-mix(in srgb, var(--card) 92%, transparent);
                    border: 1px solid var(--border);
                    border-radius: 999px;
                    padding: 8px;
                    gap: 6px;
                    backdrop-filter: blur(26px);
                    -webkit-backdrop-filter: blur(26px);
                    box-shadow: var(--shadow-lg);
                }

                .pill-segment {
                    flex: 1;
                    min-width: 0;
                    padding: 12px 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 6px;
                    border-radius: 999px;
                    transition: background 0.2s ease, box-shadow 0.2s ease;
                }

                .pill-segment:hover {
                    background: color-mix(in srgb, var(--text) 6%, transparent);
                    box-shadow: inset 0 0 0 1px var(--stroke-subtle);
                }

                .pill-label {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    color: var(--primary);
                }

                .pill-meta {
                    margin-left: 6px;
                    font-weight: 500;
                    letter-spacing: 0.08em;
                    font-size: 9px;
                    color: var(--text-muted);
                }

                .pill-divider {
                    width: 1px;
                    margin: 12px 0;
                    background: var(--stroke-subtle);
                    border-radius: 999px;
                }

                .pill-control .ant-select-selector,
                .pill-control .ant-picker,
                .pill-control.ant-picker {
                    height: 42px !important;
                    min-height: 42px !important;
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }

                .pill-control .ant-select-selector {
                    align-items: center !important;
                }

                .pill-control .ant-select-selection-item,
                .pill-control .ant-picker-input > input {
                    color: var(--text) !important;
                    font-weight: 600;
                    font-size: 15px;
                }

                .pill-control .ant-select-selection-placeholder {
                    color: var(--text-muted) !important;
                }

                .pill-control .ant-picker-input {
                    justify-content: center;
                }

                .pill-control .ant-picker-input > input {
                    padding-left: 0;
                    text-align: center;
                }

                .pill-control .ant-select-arrow,
                .pill-control .ant-picker-suffix {
                    color: var(--text-muted) !important;
                }

                .pill-control .ant-picker-prefix,
                .pill-control .ant-select-prefix {
                    color: var(--primary) !important;
                }

                .pill-guest-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .pill-guest-count {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text);
                }

                .pill-guest-actions {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .pill-step-btn {
                    width: 30px;
                    height: 30px;
                    border-radius: 999px;
                    border: 1px solid var(--stroke-subtle);
                    background: transparent;
                    color: var(--text);
                    font-size: 16px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .pill-step-btn:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: color-mix(in srgb, var(--primary) 12%, transparent);
                }

                .pill-submit {
                    padding: 0 30px;
                    background: var(--primary);
                    color: var(--on-primary);
                    border: none;
                    border-radius: 999px;
                    font-weight: 700;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
                    transition: all 0.2s ease;
                }

                .pill-submit:hover {
                    filter: brightness(1.08);
                    transform: translateY(-1px);
                }

                .mini-loader {
                    width: 28px;
                    height: 28px;
                    border-radius: 999px;
                    border: 2px solid color-mix(in srgb, var(--primary) 30%, transparent);
                    border-top-color: var(--primary);
                    animation: miniSpin 0.8s linear infinite;
                }

                @keyframes miniSpin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 1024px) {
                    .reservation-pill {
                        flex-direction: column;
                        border-radius: 24px;
                    }

                    .pill-divider {
                        width: 100%;
                        height: 1px;
                        margin: 0;
                    }

                    .pill-submit {
                        width: 100%;
                        justify-content: center;
                    }
                }

                .reservation-time-popup,
                .reservation-guest-popup {
                    z-index: 1200 !important;
                    background: var(--card) !important;
                    border: 1px solid var(--border) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
                    padding: 6px !important;
                    overscroll-behavior: contain;
                }

                .reservation-time-popup .ant-picker-panel-container,
                .reservation-time-popup .ant-picker-panel,
                .reservation-time-popup .ant-picker-time-panel,
                .reservation-time-popup .ant-picker-content,
                .reservation-time-popup .ant-picker-footer {
                    background: var(--card) !important;
                    color: var(--text) !important;
                    border-color: var(--border) !important;
                }

                .reservation-time-popup .ant-picker-time-panel-column > li {
                    color: var(--text-muted) !important;
                }

                .reservation-time-popup .ant-picker-time-panel-column > li.ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
                    background: color-mix(in srgb, var(--primary) 20%, transparent) !important;
                    color: var(--text) !important;
                    border-radius: 8px !important;
                }

                .reservation-time-popup .ant-picker-time-panel-column > li.ant-picker-time-panel-cell-disabled {
                    opacity: 0.35;
                }

                .reservation-time-popup .ant-picker-now-btn {
                    color: var(--primary) !important;
                }

                .reservation-time-popup .ant-picker-ok button {
                    color: var(--on-primary) !important;
                    background: var(--primary) !important;
                    border-color: var(--primary) !important;
                }

                .reservation-time-popup .rc-virtual-list-holder,
                .reservation-guest-popup .rc-virtual-list-holder {
                    overscroll-behavior: contain;
                }

                .reservation-guest-popup .ant-select-item {
                    color: var(--text) !important;
                    border-radius: 8px !important;
                    font-weight: 600 !important;
                }

                .reservation-guest-popup .ant-select-item-option-active {
                    background: var(--surface-subtle) !important;
                }

                .reservation-guest-popup .ant-select-item-option-selected {
                    background: color-mix(in srgb, var(--primary) 20%, transparent) !important;
                    color: var(--text) !important;
                }

                /* Guest stepper InputNumber */
                .reservation-guest-stepper .ant-input-number {
                    border: none !important;
                    box-shadow: none !important;
                    background: transparent !important;
                }
            `}</style>

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
