'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import reservationService, { ReservationDetail } from '@/lib/services/reservationService';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ReservationLookupSection() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ReservationDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const cleanCode = code.replace(/#/g, '').trim().toUpperCase();
            const data = await reservationService.lookupReservation({
                code: cleanCode,
            });
            setResult(data);
        } catch (err: any) {
            setError(t('landing.lookup.error'));
        } finally {
            setLoading(false);
        }
    };

    const statusColor: Record<string, string> = {
        PENDING: '#f59e0b',
        CONFIRMED: '#3b82f6',
        CHECKED_IN: '#8b5cf6',
        COMPLETED: '#22c55e',
        CANCELLED: '#ef4444',
    };

    const statusI18nKey: Record<string, string> = {
        PENDING: 'landing.lookup.status.pending',
        CONFIRMED: 'landing.lookup.status.confirmed',
        CHECKED_IN: 'landing.lookup.status.checked_in',
        COMPLETED: 'landing.lookup.status.completed',
        CANCELLED: 'landing.lookup.status.cancelled',
    };

    return (
        <section className="relative py-24 px-4 bg-[var(--surface)] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-30">
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--primary)] blur-3xl" />
                <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-orange-300 blur-3xl" />
            </div>

            <div className="relative max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <div
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-[0.22em] uppercase mb-6"
                        style={{
                            background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
                            color: 'var(--primary)',
                        }}
                    >
                        {t('landing.lookup.badge')}
                    </div>

                    <h2
                        className="text-4xl md:text-5xl font-black mb-4"
                        style={{ color: 'var(--text)', fontFamily: 'var(--font-display, serif)' }}
                    >
                        {t('landing.lookup.title')}
                    </h2>

                    <p className="text-base md:text-lg" style={{ color: 'var(--text-muted)' }}>
                        {t('landing.lookup.description')}
                    </p>
                </div>

                <form
                    onSubmit={handleLookup}
                    className="rounded-3xl p-5 md:p-7 mb-7 backdrop-blur-md"
                    style={{
                        background: 'color-mix(in srgb, var(--card) 88%, transparent)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                    }}
                >
                    <div className="mb-5">
                        <label
                            className="block text-xs font-bold uppercase tracking-[0.18em] mb-2"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {t('landing.lookup.code_label')}
                        </label>
                        <div
                            className="flex items-center gap-3 rounded-2xl px-4 py-2"
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <span className="text-lg" style={{ color: 'var(--primary)' }}>#</span>
                            <input
                                type="text"
                                placeholder={t('landing.lookup.placeholder')}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-transparent py-2 font-mono text-base outline-none"
                                style={{ color: 'var(--text)' }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-2xl text-base font-bold transition-all"
                        style={{
                            background: 'var(--primary)',
                            color: 'var(--on-primary)',
                            boxShadow: '0 8px 20px var(--primary-glow)',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? t('landing.lookup.searching') : t('landing.lookup.search_btn')}
                    </button>

                    {error && (
                        <div
                            className="mt-4 text-sm font-medium rounded-xl px-4 py-3"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                        >
                            {error}
                        </div>
                    )}
                </form>

                {result && (
                    <div
                        className="rounded-3xl overflow-hidden"
                        style={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                        }}
                    >
                        <div
                            className="px-6 py-5 flex items-center justify-between"
                            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
                        >
                            <div>
                                <p className="text-xs uppercase tracking-[0.18em] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
                                    {t('landing.lookup.result.confirmation_code')}
                                </p>
                                <span className="text-xl font-mono font-bold" style={{ color: 'var(--primary)' }}>
                                    #{result.confirmationCode}
                                </span>
                            </div>
                            <span
                                className="px-3 py-1.5 rounded-full text-xs font-bold border"
                                style={{
                                    color: statusColor[result.status.code] ?? 'var(--text)',
                                    background: `${statusColor[result.status.code] ?? '#888'}1A`,
                                    borderColor: `${statusColor[result.status.code] ?? '#888'}55`,
                                }}
                            >
                                {t(statusI18nKey[result.status.code] || '', { defaultValue: result.status.name })}
                            </span>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoCard label={t('landing.lookup.result.guest_name')} value={result.contact.name} icon="person" />
                                <InfoCard label={t('landing.lookup.result.phone')} value={result.contact.phone} icon="call" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoCard
                                    label={t('landing.lookup.result.date_time')}
                                    value={new Date(result.reservationDateTime).toLocaleString(undefined, {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                    icon="event"
                                />
                                <InfoCard
                                    label={t('landing.lookup.result.guests')}
                                    value={`${result.numberOfGuests} ${t('landing.lookup.result.guests_suffix')}`}
                                    icon="group"
                                />
                            </div>

                            <InfoCard
                                label={t('landing.lookup.result.table')}
                                value={result.tables.map(t => `${t.code} (${t.floorName})`).join(', ')}
                                icon="table_restaurant"
                            />

                            {result.specialRequests && (
                                <div
                                    className="rounded-2xl p-4"
                                    style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
                                >
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-muted)' }}>
                                        {t('landing.lookup.result.special_requests')}
                                    </p>
                                    <p className="text-sm italic" style={{ color: 'var(--text)' }}>
                                        &ldquo;{result.specialRequests}&rdquo;
                                    </p>
                                </div>
                            )}

                            <div className="pt-2 mt-2">
                                <Link
                                    href={`/your-reservation/${encodeURIComponent(result.confirmationCode || result.id)}`}
                                    className="flex w-full items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:brightness-110"
                                    style={{
                                        background: 'var(--primary)',
                                        color: 'var(--on-primary)',
                                        boxShadow: '0 8px 20px var(--primary-glow)',
                                    }}
                                >
                                    {t('landing.lookup.result.view_details', 'View Details')}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
            <span className="material-symbols-outlined text-base" style={{ color: 'var(--primary)' }}>{icon}</span>
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{value || '—'}</p>
            </div>
        </div>
    );
}
