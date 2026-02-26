'use client';

import { useState } from 'react';
import reservationService, { ReservationDetail } from '@/lib/services/reservationService';

export default function ReservationLookupSection() {
    const [code, setCode] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ReservationDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !phone.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await reservationService.lookupReservation({
                code: code.trim().toUpperCase(),
                phone: phone.trim(),
            });
            setResult(data);
        } catch {
            setError('Không tìm thấy đặt bàn. Vui lòng kiểm tra lại mã đặt bàn và số điện thoại.');
        } finally {
            setLoading(false);
        }
    };

    const statusColor: Record<string, string> = {
        PENDING: '#FFA500',
        CONFIRMED: '#3b82f6',
        CHECKED_IN: '#8b5cf6',
        COMPLETED: '#22c55e',
        CANCELLED: '#ef4444',
    };

    return (
        <section className="py-20 px-4" style={{ background: 'var(--surface)' }}>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold tracking-[0.2em] uppercase mb-5"
                        style={{
                            borderColor: 'var(--primary-border)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'var(--primary)',
                        }}
                    >
                        <span>🔍</span> Tra cứu đặt bàn
                    </div>
                    <h2
                        className="text-3xl md:text-4xl font-bold mb-3"
                        style={{ color: 'var(--text)', fontFamily: 'var(--font-display, serif)' }}
                    >
                        Kiểm tra đặt bàn của bạn
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm leading-relaxed">
                        Nhập mã xác nhận và số điện thoại để xem trạng thái đặt bàn
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleLookup}
                    className="rounded-2xl p-6 md:p-8 mb-6"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label
                                className="block text-xs font-bold uppercase tracking-widest mb-2"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Mã đặt bàn
                            </label>
                            <input
                                type="text"
                                placeholder="VD: RX-B17F1B"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl font-mono text-sm outline-none transition-all"
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                                required
                            />
                        </div>
                        <div>
                            <label
                                className="block text-xs font-bold uppercase tracking-widest mb-2"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                placeholder="VD: 0901234567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !code.trim() || !phone.trim()}
                        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                        style={{
                            background: 'var(--primary)',
                            color: 'var(--on-primary, white)',
                            boxShadow: '0 4px 12px var(--primary-glow)',
                        }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Đang tìm kiếm...
                            </span>
                        ) : (
                            '🔍 Tra cứu ngay'
                        )}
                    </button>
                </form>

                {/* Error */}
                {error && (
                    <div
                        className="rounded-xl p-4 flex items-start gap-3 mb-4"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                        <span className="text-lg mt-0.5">❌</span>
                        <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                    >
                        {/* Result header */}
                        <div
                            className="px-6 py-4 flex items-center justify-between"
                            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
                        >
                            <div>
                                <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
                                    Mã xác nhận
                                </p>
                                <span className="text-lg font-mono font-bold" style={{ color: 'var(--primary)' }}>
                                    #{result.confirmationCode}
                                </span>
                            </div>
                            <span
                                className="px-3 py-1.5 rounded-full text-xs font-bold border"
                                style={{
                                    color: statusColor[result.status.code] ?? 'var(--text)',
                                    background: `${statusColor[result.status.code] ?? '#888'}18`,
                                    borderColor: `${statusColor[result.status.code] ?? '#888'}33`,
                                }}
                            >
                                {result.status.name}
                            </span>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Contact */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard label="Tên" value={result.contact.name} icon="👤" />
                                <InfoCard label="Số điện thoại" value={result.contact.phone} icon="📞" />
                            </div>

                            {/* Booking */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard
                                    label="Ngày & Giờ"
                                    value={new Date(result.reservationDateTime).toLocaleString('vi-VN', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                    icon="📅"
                                />
                                <InfoCard label="Số khách" value={`${result.numberOfGuests} người`} icon="👥" />
                            </div>

                            {/* Tables */}
                            <InfoCard
                                label="Bàn đặt"
                                value={result.tables.map(t => `${t.code} (${t.floorName})`).join(', ')}
                                icon="🪑"
                            />

                            {/* Special requests */}
                            {result.specialRequests && (
                                <div
                                    className="rounded-xl p-4"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                >
                                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                                        Yêu cầu đặc biệt
                                    </p>
                                    <p className="text-sm italic" style={{ color: 'var(--text)' }}>
                                        &ldquo;{result.specialRequests}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Cancelled state */}
                            {result.status.code === 'CANCELLED' && (
                                <div
                                    className="rounded-xl p-3 text-center"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                                >
                                    <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                                        Đặt bàn này đã bị huỷ
                                    </p>
                                </div>
                            )}
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
            className="rounded-xl p-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                {icon} {label}
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {value}
            </p>
        </div>
    );
}
