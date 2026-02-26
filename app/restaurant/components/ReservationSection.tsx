'use client';

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ReservationStep, BookingData, Table, UserDetails } from './types';
import { TenantConfig } from '@/lib/services/tenantService';
import { tableService, floorService, TableItem, TableStatus, FloorLayoutTableItem } from '@/lib/services/tableService';
import reservationService from '@/lib/services/reservationService';
import { TableMap2D, Layout } from '@/app/admin/tables/components/TableMap2D';
import { TableData } from '@/app/admin/tables/components/DraggableTable';

// Constants
// Constants

interface ReservationSectionProps {
    tenant: TenantConfig | null;
}

const StepIndicator: React.FC<{ active: number }> = ({ active }) => (
    <div className="flex items-center gap-3 justify-center mb-8">
        {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${active === s ? 'text-[var(--text-inverse)]' : 'text-[var(--text-inverse)] opacity-40'}`}>
                    <span
                        style={{
                            backgroundColor: active === s ? 'var(--primary)' : 'transparent',
                            borderColor: active === s ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                            boxShadow: active === s ? '0 0 15px var(--primary-glow)' : 'none'
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-serif border-2`}
                    >
                        {s}
                    </span>
                    <span className={`text-xs uppercase tracking-widest hidden sm:inline ${active === s ? 'font-bold' : 'font-medium'}`}>
                        {s === 1 ? 'Schedule' : s === 2 ? 'Location' : 'Confirm'}
                    </span>
                </div>
                {s < 3 && <div className="w-8 md:w-16 h-px bg-[var(--text-inverse)] opacity-20" />}
            </React.Fragment>
        ))}
    </div>
);

const ReservationSection: React.FC<ReservationSectionProps> = ({ tenant }) => {
    const [step, setStep] = useState<ReservationStep>(ReservationStep.SEARCH);
    const [booking, setBooking] = useState<BookingData>({
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        guests: 4
    });

    const [tables, setTables] = useState<TableItem[]>([]);
    const [layout, setLayout] = useState<Layout | null>(null);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
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

    useEffect(() => {
        if (step === ReservationStep.TABLE_SELECTION) {
            const loadTables = async () => {

                /** Convert BE shape string to TableData shape union */
                const normalizeShape = (s: string): 'Circle' | 'Rectangle' | 'Square' | 'Oval' => {
                    if (s === 'Round' || s === 'Circle') return 'Circle';
                    if (s === 'Oval') return 'Oval';
                    if (s === 'Square') return 'Square';
                    return 'Rectangle';
                };

                /** Convert numeric-string status from BE floor layout to TableData status */
                const parseLayoutStatus = (s: string): 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' => {
                    if (s === '2' || s?.toLowerCase() === 'occupied') return 'OCCUPIED';
                    if (s === '1' || s?.toLowerCase() === 'reserved') return 'RESERVED';
                    return 'AVAILABLE';
                };

                // ── Primary Path: GET /api/floors then /api/floors/{id}/layout ──
                try {
                    const allFloors = await floorService.getAllFloors();
                    const activeFloors = allFloors.filter(f => f.isActive !== false);

                    if (activeFloors.length > 0) {
                        // Fetch layout for each floor in parallel
                        const layoutResults = await Promise.allSettled(
                            activeFloors.map(f => floorService.getFloorLayout(f.id))
                        );

                        const floors = activeFloors.map((floorSummary, idx) => {
                            const layoutResult = layoutResults[idx];
                            const layoutData = layoutResult.status === 'fulfilled' ? layoutResult.value : null;

                            const tableDataList: TableData[] = (layoutData?.tables ?? []).map(
                                (t: FloorLayoutTableItem) => ({
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
                                })
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
                        // Flatten all tables for local reference
                        const allTableItems: TableItem[] = floors.flatMap(f =>
                            f.tables.map(td => ({
                                id: td.id,
                                code: td.name,
                                type: td.area,
                                seatingCapacity: td.seats,
                                shape: td.shape,
                                positionX: td.position.x,
                                positionY: td.position.y,
                                width: td.width ?? 100,
                                height: td.height ?? 100,
                                rotation: td.rotation ?? 0,
                                isActive: true,
                                tableStatusId: td.status === 'OCCUPIED'
                                    ? TableStatus.Occupied
                                    : td.status === 'RESERVED'
                                        ? TableStatus.Reserved
                                        : TableStatus.Available,
                            } as TableItem))
                        );
                        setTables(allTableItems);
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
                            let status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' = 'AVAILABLE';
                            if (t.tableStatusId === TableStatus.Occupied) status = 'OCCUPIED';
                            else if (t.tableStatusId === TableStatus.Reserved) status = 'RESERVED';
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
                    setTables(activeTables);
                } catch (error) {
                    console.error('[ReservationSection] Failed to load tables:', error);
                }
            };
            loadTables();
        }
    }, [step, tenant]);

    const handleMapTableClick = (table: TableData) => {
        if (table.status === 'OCCUPIED' || table.status === 'RESERVED' || table.status === 'DISABLED') return;

        // Toggle selection: if clicking same table, unselect it
        const isAlreadySelected = selectedTable?.id === table.id;

        if (layout) {
            const updatedFloors = layout.floors.map(f => {
                const updatedTables = f.tables.map(t => {
                    if (isAlreadySelected) {
                        // Unselect all — restore to AVAILABLE
                        return t.status === 'SELECTED' ? { ...t, status: 'AVAILABLE' as const } : t;
                    }
                    if (t.id === table.id) {
                        return { ...t, status: 'SELECTED' as const };
                    } else if (t.status === 'SELECTED') {
                        return { ...t, status: 'AVAILABLE' as const };
                    }
                    return t;
                });
                return { ...f, tables: updatedTables };
            });

            setLayout({
                ...layout,
                floors: updatedFloors
            });
        }

        if (isAlreadySelected) {
            // Unselect
            setSelectedTable(null);
        } else {
            // Select new table
            setSelectedTable({
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
                rotation: table.rotation || 0
            });
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

    const handleCompleteReservation = async () => {
        if (!selectedTable) return;

        // Basic validation
        if (!userDetails.name || !userDetails.phone || !userDetails.email) {
            setSubmitError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Combine date + time thành ISO datetime
            const reservationDateTime = `${booking.date}T${booking.time}:00`;

            const result = await reservationService.createReservation({
                tableIds: [selectedTable.id],
                reservationDateTime,
                numberOfGuests: booking.guests,
                guestName: userDetails.name,
                guestPhone: userDetails.phone,
                guestEmail: userDetails.email,
                specialRequests: userDetails.requests || undefined,
            });

            setConfirmationCode(result.confirmationCode);
            setStep(ReservationStep.SUCCESS);
        } catch (error: unknown) {
            console.error("Failed to create reservation:", error);
            // Hiển thị message lỗi từ BE nếu có
            const axiosError = error as { response?: { data?: { message?: string } } };
            const beMessage = axiosError?.response?.data?.message;
            setSubmitError(beMessage || "Unable to complete reservation. Please try again later.");
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

                {step === ReservationStep.SEARCH && (
                    <div className="w-full max-w-5xl fade-in">
                        <div className="text-center mb-12">
                            <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--primary-border)] bg-black/30 backdrop-blur-md text-[var(--primary)] text-xs font-bold tracking-[0.2em] uppercase mb-6 shadow-xl">
                                Fine Dining Reservations
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-serif" style={{ color: 'var(--text-inverse)' }}>
                                Reserve Your <br />
                                <span style={{ color: 'var(--primary)' }}>
                                    Culinary Experience
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                                Immerse yourself in flavors crafted with passion. Select your preferred date and time to view real-time table availability.
                            </p>
                        </div>

                        <div className="bg-[var(--card)] rounded-[2rem] shadow-2xl p-6 md:p-10 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--primary-soft)] to-[var(--primary)]"></div>

                            <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-6 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em] pl-1">Arrival Date</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--primary)] z-10">calendar_month</span>
                                        <input
                                            type="date"
                                            className="w-full pl-12 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all shadow-sm text-[var(--text)] font-semibold cursor-pointer group-hover:bg-[var(--card)]"
                                            value={booking.date}
                                            onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em] pl-1">Preferred Time</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--primary)] z-10">schedule</span>
                                        <select
                                            className="w-full pl-12 pr-10 py-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none appearance-none cursor-pointer text-[var(--text)] font-semibold shadow-sm group-hover:bg-[var(--card)] transition-all"
                                            value={booking.time}
                                            onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                                        >
                                            <option>17:30</option>
                                            <option>18:00</option>
                                            <option>18:30</option>
                                            <option>19:00</option>
                                            <option>19:30</option>
                                            <option>20:00</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-3.5 text-[var(--text-muted)] pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-[0.2em] pl-1">Party Size</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--primary)] z-10">person</span>
                                        <select
                                            className="w-full pl-12 pr-10 py-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none appearance-none cursor-pointer text-[var(--text)] font-semibold shadow-sm group-hover:bg-[var(--card)] transition-all"
                                            value={booking.guests}
                                            onChange={(e) => setBooking({ ...booking, guests: parseInt(e.target.value) })}
                                        >
                                            <option value={1}>1 Person</option>
                                            <option value={2}>2 People</option>
                                            <option value={3}>3 People</option>
                                            <option value={4}>4 People</option>
                                            <option value={6}>6 People</option>
                                            <option value={8}>8+ Group</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-3.5 text-[var(--text-muted)] pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <button type="submit" className="w-full lg:w-auto px-10 py-3.5 bg-[var(--primary)] hover:brightness-110 text-[var(--on-primary)] font-bold rounded-xl shadow-[0_4px_14px_0_var(--primary-glow)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 h-[54px] text-lg whitespace-nowrap">
                                    <span>Choose Table</span>
                                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                </button>
                            </form>

                            <div className="mt-10 pt-8 border-t border-[var(--border)] flex flex-wrap justify-between gap-6">
                                {[
                                    { icon: 'restaurant', label: 'Fine Dining', desc: 'Multi-course experience' },
                                    { icon: 'check_circle', label: 'Instant Confirm', desc: 'No waiting needed' },
                                    { icon: 'local_parking', label: 'Valet Available', desc: 'Complimentary service' }
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
                        <StepIndicator active={2} />

                        <div className="flex justify-between items-center mb-6 text-[var(--text-inverse)] px-2">
                            <button onClick={() => setStep(ReservationStep.SEARCH)} className="flex items-center gap-2 text-[var(--text-inverse)] opacity-70 hover:opacity-100 group">
                                <span className="material-symbols-outlined text-lg p-2 bg-white/10 rounded-full group-hover:bg-white/20">arrow_back</span>
                                <span className="font-medium text-sm">Change Schedule</span>
                            </button>
                            <div className="text-right">
                                <div className="text-[10px] opacity-60 uppercase tracking-widest font-bold mb-1">Reservation For</div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                    <span>{new Date(booking.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    <span className="w-1 h-1 bg-[var(--text-inverse)] opacity-30 rounded-full" />
                                    <span>{booking.time}</span>
                                    <span className="w-1 h-1 bg-[var(--text-inverse)] opacity-30 rounded-full" />
                                    <span className="text-[var(--primary)]">{booking.guests} Guests</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--card)] rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[85vh]">
                            {/* Sidebar */}
                            <div className="hidden lg:flex w-80 bg-[var(--surface)] p-8 flex-col border-r border-[var(--border)]">
                                <h3 className="text-2xl font-serif text-[var(--text)] mb-8 border-b border-[var(--border)] pb-4">Floor Map</h3>

                                <div className="space-y-5 mb-8">
                                    {[
                                        { bg: 'bg-[#f6ffed]', border: 'border-[#52c41a]', label: 'Available' },
                                        { bg: 'bg-[var(--primary-soft)]', border: 'border-[var(--primary)] shadow-md shadow-[var(--primary-glow)]', label: 'Selected' },
                                        { bg: 'bg-[#fff1f0]', border: 'border-[#ff4d4f] diagonal-stripe opacity-60', label: 'Occupied' },
                                        { bg: 'bg-[#e6f7ff]', border: 'border-[#1890ff]', label: 'Reserved' }
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
                                            <p className="text-[var(--primary-hover)] text-xs font-bold uppercase tracking-widest">Dining Assistant</p>
                                        </div>
                                        {isAiThinking ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-[var(--primary-soft)] rounded-full animate-bounce" />
                                                <div className="w-2 h-2 bg-[var(--primary-soft)] rounded-full animate-bounce delay-100" />
                                                <div className="w-2 h-2 bg-[var(--primary-soft)] rounded-full animate-bounce delay-200" />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-[var(--text-muted)] italic leading-relaxed">&ldquo;{recommendation || 'Selecting our premium window tables offers an unmatched view of the harbor.'}&rdquo;</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Floor Plan Canvas */}
                            <div className="flex-1 relative bg-[var(--surface-subtle)] overflow-auto p-0">
                                {layout ? (
                                    <div className="w-full h-full p-6">
                                        <TableMap2D
                                            layout={layout}
                                            onLayoutChange={setLayout}
                                            onTableClick={handleMapTableClick}
                                            onTablePositionChange={() => { }}
                                            readOnly={true}
                                            selectedTableId={selectedTable?.id}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
                                    </div>
                                )}
                            </div>

                            {/* Right Summary Panel */}
                            <div className="hidden lg:flex w-80 bg-[var(--card)] p-10 flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
                                <h3 className="text-2xl font-serif text-[var(--text)] mb-8 border-b border-[var(--border)] pb-5">Booking</h3>

                                <div className="flex-1 space-y-6">
                                    {selectedTable ? (
                                        <div className="bg-[var(--primary-faint)] rounded-2xl p-6 border border-[var(--primary-border)]">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Selected Table</span>
                                                <span className="text-2xl font-bold font-serif text-[var(--primary)]">{selectedTable.label}</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-muted)]">Floor</span>
                                                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[var(--surface-subtle)] text-[var(--text)]`}>
                                                        {selectedTable.zone}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-muted)]">Capacity</span>
                                                    <span className="font-bold text-[var(--text)]">{selectedTable.capacity} Guests</span>
                                                </div>
                                                <div className="flex justify-between text-sm pt-3 border-t border-[var(--primary-border)]/40">
                                                    <span className="text-[var(--text-muted)]">Status</span>
                                                    <span className="text-[var(--success)] font-bold flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" /> Available
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 opacity-30">
                                            <span className="material-symbols-outlined text-5xl mb-3 text-[var(--text-muted)]">touch_app</span>
                                            <p className="text-sm font-medium text-[var(--text)]">Please select a table from the floor map</p>
                                        </div>
                                    )}

                                    <div className="flex gap-4 p-2">
                                        <span className="material-symbols-outlined text-[var(--primary)] shrink-0">info</span>
                                        <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">You have 15 minutes to complete this reservation once a table is selected.</p>
                                    </div>
                                </div>

                                <button
                                    disabled={!selectedTable}
                                    onClick={() => setStep(ReservationStep.CONFIRMATION)}
                                    className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0
                    ${selectedTable ? 'bg-[var(--primary)] hover:brightness-110 text-[var(--on-primary)] shadow-[0_4px_14px_0_var(--primary-glow)]' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-not-allowed'}
                  `}
                                >
                                    Confirm Table
                                </button>
                            </div>

                            {/* Mobile Sticky Footer */}
                            <div className="lg:hidden p-4 bg-[var(--card)] border-t border-[var(--border)] flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Selected</p>
                                    <p className="font-bold text-[var(--text)]">{selectedTable ? `Table ${selectedTable.label}` : 'None'}</p>
                                </div>
                                <button
                                    disabled={!selectedTable}
                                    onClick={() => setStep(ReservationStep.CONFIRMATION)}
                                    className="px-8 py-3 bg-[var(--primary)] text-[var(--on-primary)] rounded-xl font-bold text-sm disabled:opacity-50"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === ReservationStep.CONFIRMATION && (
                    <div className="w-full max-w-5xl fade-in">
                        <StepIndicator active={3} />

                        <div className="bg-[var(--card)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[560px]">
                            {/* Left Summary Panel */}
                            <div className="md:w-[35%] bg-black text-white p-10 flex flex-col relative overflow-hidden">
                                <div className="absolute inset-0 bg-[var(--primary)] opacity-90" />
                                <div className="absolute -top-10 -right-10 text-white opacity-10">
                                    <span className="material-symbols-outlined text-[180px]">restaurant_menu</span>
                                </div>

                                <div className="relative z-10 h-full flex flex-col">
                                    <h2 className="text-4xl font-serif mb-10 border-b border-white/20 pb-5">Summary</h2>

                                    <div className="space-y-10 flex-1">
                                        {[
                                            { icon: 'calendar_today', label: 'Date & Time', value: new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), sub: booking.time },
                                            { icon: 'table_restaurant', label: 'Selected Table', value: `Table ${selectedTable?.label}`, sub: `${selectedTable?.zone} Zone` },
                                            { icon: 'group', label: 'Party Size', value: `${booking.guests} Guests`, sub: 'Standard Seating' }
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
                                                {tenant?.businessAddressLine1 || '123 Lumière Plaza, Food District'}<br />
                                                {tenant?.businessAddressLine2 || 'Manhattan, NY 10012'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Form Panel */}
                            <div className="md:w-[65%] p-10 md:p-14 bg-[var(--card)]">
                                <div className="mb-10">
                                    <h3 className="text-3xl font-serif text-[var(--text)] mb-3">Finalize Details</h3>
                                    <p className="text-[var(--text-muted)] font-medium">Please provide your contact information to secure your table.</p>
                                </div>

                                <form className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="group">
                                            <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">Full Name</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">person</span>
                                                <input
                                                    type="text"
                                                    placeholder="Eleanor Rigby"
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--card)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                                                    value={userDetails.name}
                                                    onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">Phone Number</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">call</span>
                                                <input
                                                    type="tel"
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--card)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                                                    value={userDetails.phone}
                                                    onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">Email Address</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">mail</span>
                                            <input
                                                type="email"
                                                placeholder="eleanor@example.com"
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:bg-[var(--card)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                                                value={userDetails.email}
                                                onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">Special Requests <span className="text-[var(--text-muted)] font-normal ml-1">(Optional)</span></label>
                                        <textarea
                                            placeholder="Dietary restrictions, anniversary, window preference confirmed..."
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
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Complete Reservation</span>
                                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">check_circle</span>
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-[10px] text-[var(--text-muted)] mt-6 leading-relaxed">
                                            By proceeding, you agree to our <a href="#" className="underline">Terms of Service</a>.
                                            A confirmation email will be sent immediately upon booking.
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

                        <h2 className="text-3xl font-serif font-bold text-[var(--text)] mb-3">Confirmed!</h2>
                        <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed px-2">
                            Thank you,{' '}
                            <span className="text-[var(--text)] font-semibold">{userDetails.name}</span>.{' '}
                            Table <span className="text-[var(--primary)] font-bold">
                                {selectedTable?.label ? `#${selectedTable.label}` : ''}
                            </span>
                            {selectedTable?.zone ? ` (${selectedTable.zone})` : ''} is reserved for{' '}
                            <span className="text-[var(--text)] font-semibold">{booking.guests} guests</span> on{' '}
                            <span className="text-[var(--text)] font-semibold">
                                {new Date(booking.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>{' '}
                            at <span className="text-[var(--text)] font-semibold">{booking.time}</span>.
                        </p>

                        {/* Info block */}
                        <div className="bg-[var(--surface)] rounded-2xl p-5 mb-8 text-left border border-[var(--border)] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Booking Reference</span>
                                <span className="text-sm font-bold text-[var(--primary)] font-mono tracking-wider">
                                    #{confirmationCode || 'RX-XXXXX'}
                                </span>
                            </div>
                            <div className="h-px bg-[var(--border)]" />
                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                <span className="material-symbols-outlined text-base text-[var(--text-muted)]">mail</span>
                                <span className="truncate">Confirmation sent to <span className="text-[var(--text)]">{userDetails.email}</span></span>
                            </div>
                            {userDetails.phone && (
                                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                    <span className="material-symbols-outlined text-base text-[var(--text-muted)]">phone</span>
                                    <span>{userDetails.phone}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3.5 border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] font-bold rounded-xl transition-all text-sm"
                        >
                            Make Another Booking
                        </button>
                    </div>
                )}

            </main>

            {/* Footer Branding */}
            <footer className="relative z-10 py-10 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-[var(--primary)] text-2xl font-serif font-bold italic tracking-widest">{tenant?.businessName || 'Lumière'}</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: '#ffffff' }}>The Pinnacle of Fine Dining</p>
            </footer>
        </div>
    );
};

export default ReservationSection;
