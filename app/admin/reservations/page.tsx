"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import reservationService, {
    ReservationListItem,
    ReservationDetail,
    PaginatedReservations,
} from "@/lib/services/reservationService";

// ─── Status actions (keys mapped to i18n) ────────────────────────────────────
const STATUS_ACTIONS_KEYS: Record<
    string,
    { actionKey: string; nextStatusId: number; color: string }[]
> = {
    PENDING: [
        { actionKey: "confirm", nextStatusId: 2, color: "var(--primary)" },
        { actionKey: "cancel", nextStatusId: 5, color: "#ef4444" },
    ],
    CONFIRMED: [
        { actionKey: "complete", nextStatusId: 4, color: "#22c55e" },
        { actionKey: "cancel", nextStatusId: 5, color: "#ef4444" },
    ],
    COMPLETED: [],
    CANCELLED: [],
};

// Map nextStatusId → status code key for side effects lookup
const STATUS_ID_TO_CODE: Record<number, string> = {
    2: "CONFIRMED",
    4: "COMPLETED",
    5: "CANCELLED",
};

// ─── Badge component ──────────────────────────────────────────────────────────
function StatusBadge({ code, name, colorCode }: { code: string; name: string; colorCode: string }) {
    const bg = colorCode ? `${colorCode}22` : "rgba(255,255,255,0.08)";
    return (
        <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
            style={{ color: colorCode, backgroundColor: bg, borderColor: `${colorCode}44` }}
        >
            {name || code}
        </span>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ReservationDetailModal({
    reservationId,
    onClose,
    onStatusUpdated,
}: {
    reservationId: string;
    onClose: () => void;
    onStatusUpdated: () => void;
}) {
    const { t } = useTranslation();
    const [detail, setDetail] = useState<ReservationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        actionKey: string;
        nextStatusId: number;
        color: string;
    } | null>(null);

    useEffect(() => {
        reservationService.getReservationById(reservationId)
            .then(setDetail)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [reservationId]);

    const handleAction = async (nextStatusId: number) => {
        setActionLoading(true);
        try {
            await reservationService.updateReservationStatus(reservationId, nextStatusId);
            onStatusUpdated();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm(t('admin.reservations.actions.quick_cancel') + "?")) return;
        setActionLoading(true);
        try {
            await reservationService.deleteReservation(reservationId);
            onStatusUpdated();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const actions = detail ? STATUS_ACTIONS_KEYS[detail.status.code] ?? [] : [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                            {t('admin.reservations.modal.title')}
                        </h2>
                        {detail && (
                            <span className="text-sm font-mono" style={{ color: "var(--primary)" }}>
                                #{detail.confirmationCode}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "var(--surface)", color: "var(--text-muted)" }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                        </div>
                    ) : !detail ? (
                        <p className="text-center" style={{ color: "var(--text-muted)" }}>
                            {t('admin.reservations.modal.load_error')}
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {/* Status + Actions */}
                            <div
                                className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                                style={{ background: "var(--surface)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                                        {t('admin.reservations.modal.status_label')}
                                    </span>
                                    <StatusBadge {...detail.status} />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {actions.map((action) => (
                                        <button
                                            key={action.nextStatusId}
                                            onClick={() => setConfirmAction(action)}
                                            disabled={actionLoading}
                                            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                                            style={{ background: action.color }}
                                        >
                                            {t(`admin.reservations.actions.${action.actionKey}`)}
                                        </button>
                                    ))}
                                    {(detail.status.code === "PENDING" || detail.status.code === "CONFIRMED") && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={actionLoading}
                                            className="px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50"
                                            style={{ borderColor: "#ef4444", color: "#ef4444" }}
                                        >
                                            {t('admin.reservations.actions.quick_cancel')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Confirm dialog */}
                            {confirmAction && (
                                <div
                                    className="rounded-xl p-4 border"
                                    style={{ background: "var(--surface)", borderColor: confirmAction.color }}
                                >
                                    <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
                                        {t('admin.reservations.modal.confirm_action', {
                                            action: t(`admin.reservations.actions.${confirmAction.actionKey}`)
                                        })}
                                    </p>
                                    {STATUS_ID_TO_CODE[confirmAction.nextStatusId] && (
                                        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                                            {t(`admin.reservations.side_effects.${STATUS_ID_TO_CODE[confirmAction.nextStatusId]}`)}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(confirmAction.nextStatusId)}
                                            disabled={actionLoading}
                                            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white"
                                            style={{ background: confirmAction.color }}
                                        >
                                            {actionLoading
                                                ? t('admin.reservations.modal.processing')
                                                : t(`admin.reservations.actions.${confirmAction.actionKey}`)}
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction(null)}
                                            className="px-4 py-1.5 rounded-lg text-sm font-medium border"
                                            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                                        >
                                            {t('admin.reservations.modal.cancel_btn')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Info grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Contact */}
                                <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)" }}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                                        {t('admin.reservations.modal.contact_title')}
                                    </p>
                                    <InfoRow label={t('admin.reservations.modal.contact.name')} value={detail.contact.name} />
                                    <InfoRow label={t('admin.reservations.modal.contact.phone')} value={detail.contact.phone} />
                                    <InfoRow label={t('admin.reservations.modal.contact.email')} value={detail.contact.email ?? "—"} />
                                    <InfoRow
                                        label={t('admin.reservations.modal.contact.type')}
                                        value={detail.contact.isGuest
                                            ? t('admin.reservations.modal.contact.guest')
                                            : t('admin.reservations.modal.contact.member')}
                                    />
                                    {detail.contact.membershipLevel && (
                                        <InfoRow label={t('admin.reservations.modal.contact.level')} value={detail.contact.membershipLevel} />
                                    )}
                                </div>

                                {/* Booking info */}
                                <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)" }}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                                        {t('admin.reservations.modal.booking_title')}
                                    </p>
                                    <InfoRow
                                        label={t('admin.reservations.modal.booking.date_time')}
                                        value={new Date(detail.reservationDateTime).toLocaleString()}
                                    />
                                    <InfoRow
                                        label={t('admin.reservations.modal.booking.guests')}
                                        value={`${detail.numberOfGuests} ${t('admin.reservations.modal.booking.guests_suffix')}`}
                                    />
                                    <InfoRow
                                        label={t('admin.reservations.modal.booking.table')}
                                        value={detail.tables.map(t => `${t.code} (${t.floorName})`).join(", ")}
                                    />
                                    <InfoRow
                                        label={t('admin.reservations.modal.booking.deposit')}
                                        value={`${detail.depositAmount.toLocaleString()}đ`}
                                    />
                                    <InfoRow
                                        label={t('admin.reservations.modal.booking.deposit_paid')}
                                        value={detail.depositPaid
                                            ? t('admin.reservations.modal.booking.deposit_yes')
                                            : t('admin.reservations.modal.booking.deposit_no')}
                                    />
                                </div>
                            </div>

                            {/* Special requests */}
                            {detail.specialRequests && (
                                <div className="rounded-xl p-4" style={{ background: "var(--surface)" }}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                                        {t('admin.reservations.modal.special_requests')}
                                    </p>
                                    <p className="text-sm italic" style={{ color: "var(--text)" }}>
                                        &ldquo;{detail.specialRequests}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                                <span>{t('admin.reservations.modal.created_at')} {new Date(detail.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start gap-2">
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className="text-xs font-medium text-right" style={{ color: "var(--text)" }}>{value}</span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReservationsPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<PaginatedReservations | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [statusId, setStatusId] = useState<number | "">("");
    const [date, setDate] = useState("");
    const [page, setPage] = useState(1);

    // Detail modal
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await reservationService.getReservations({
                pageNumber: page,
                pageSize: 10,
                search: search || undefined,
                statusId: statusId !== "" ? statusId : undefined,
                date: date || undefined,
                sortBy: "reservationDateTime",
                sortDescending: true,
            });
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusId, date]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search, statusId, date]);

    const statusOptions = [
        { id: 1, labelKey: "pending", color: "#FFA500" },
        { id: 2, labelKey: "confirmed", color: "#3b82f6" },
        { id: 3, labelKey: "checkin", color: "#8b5cf6" },
        { id: 4, labelKey: "completed", color: "#22c55e" },
        { id: 5, labelKey: "cancelled", color: "#ef4444" },
    ];

    const pendingCount = data?.items.filter(i => i.status.code === "PENDING").length ?? 0;
    const confirmedCount = data?.items.filter(i => i.status.code === "CONFIRMED").length ?? 0;
    const checkinCount = data?.items.filter(i => i.status.code === "CHECKED_IN").length ?? 0;
    const totalCount = data?.totalCount ?? 0;

    const tableHeaderKeys = ["code", "customer", "table_floor", "date_time", "guests", "status", "walk_in", "actions"] as const;

    return (
        <main className="flex-1 p-6 lg:p-8">
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
                            {t('admin.reservations.title')}
                        </h2>
                        <p style={{ color: "var(--text-muted)" }}>
                            {t('admin.reservations.total_count', { total: totalCount.toLocaleString() })}
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {t('admin.reservations.refresh')}
                    </button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { labelKey: "total", value: totalCount, color: "var(--primary)", bg: "var(--primary-soft)" },
                        { labelKey: "pending", value: pendingCount, color: "#FFA500", bg: "rgba(255,165,0,0.1)" },
                        { labelKey: "confirmed", value: confirmedCount, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
                        { labelKey: "checkin", value: checkinCount, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
                    ].map((stat) => (
                        <div
                            key={stat.labelKey}
                            className="rounded-xl p-4 flex items-center justify-between"
                            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                        >
                            <div>
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                    {t(`admin.reservations.stats.${stat.labelKey}`)}
                                </p>
                                <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                                <svg className="w-5 h-5" style={{ color: stat.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filters ── */}
                <div
                    className="rounded-xl p-4 flex flex-wrap gap-3"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-2.5 w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={t('admin.reservations.filter.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                        />
                    </div>

                    <select
                        value={statusId}
                        onChange={(e) => setStatusId(e.target.value === "" ? "" : Number(e.target.value))}
                        className="px-3 py-2 rounded-lg text-sm outline-none min-w-[160px]"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                    >
                        <option value="">{t('admin.reservations.filter.all_status')}</option>
                        {statusOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {t(`admin.reservations.status.${s.labelKey}`)}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />

                    {(search || statusId !== "" || date) && (
                        <button
                            onClick={() => { setSearch(""); setStatusId(""); setDate(""); }}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                            {t('admin.reservations.filter.clear')}
                        </button>
                    )}
                </div>

                {/* ── Table ── */}
                <div
                    className="rounded-xl overflow-hidden"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ background: "var(--surface)" }}>
                                <tr>
                                    {tableHeaderKeys.map((key) => (
                                        <th
                                            key={key}
                                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            {t(`admin.reservations.table_headers.${key}`)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center">
                                            <div className="flex justify-center">
                                                <div
                                                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                                                    style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ) : !data?.items.length ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                                            <div className="flex flex-col items-center gap-2">
                                                <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm">{t('admin.reservations.empty')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.items.map((item: ReservationListItem) => (
                                        <tr
                                            key={item.id}
                                            className="transition-colors hover:bg-[var(--surface)]"
                                            style={{ borderBottom: "1px solid var(--border)" }}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-mono text-sm font-bold" style={{ color: "var(--primary)" }}>
                                                    #{item.confirmationCode}
                                                </span>
                                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                        style={{ background: "var(--primary)" }}
                                                    >
                                                        {item.contactName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.contactName}</p>
                                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.contactPhone}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="space-y-0.5">
                                                    {item.tables.map((t, i) => (
                                                        <div key={i} className="flex items-center gap-1">
                                                            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.code}</span>
                                                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {t.floorName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                                                    {new Date(item.reservationDateTime).toLocaleDateString(undefined, {
                                                        day: "2-digit", month: "2-digit", year: "numeric"
                                                    })}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {new Date(item.reservationDateTime).toLocaleTimeString(undefined, {
                                                        hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                                    style={{ background: "var(--surface)", color: "var(--text)" }}
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    {item.numberOfGuests}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge {...item.status} />
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <span className="material-symbols-outlined text-base" style={{ color: 'var(--text-muted)' }}>
                                                {item.isGuest ? 'sell' : 'person'}
                                            </span>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedId(item.id)}
                                                    className="p-2 rounded-lg transition-all"
                                                    style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                                                    title={t('admin.reservations.actions.view_detail')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination ── */}
                    {data && data.totalPages > 1 && (
                        <div
                            className="flex items-center justify-between px-4 py-3"
                            style={{ borderTop: "1px solid var(--border)" }}
                        >
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                {t('admin.reservations.pagination.page_info', {
                                    page: data.pageNumber,
                                    total: data.totalPages,
                                    count: data.totalCount,
                                })}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!data.hasPreviousPage}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                                >
                                    {t('admin.reservations.pagination.prev')}
                                </button>
                                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                                    const p = Math.max(1, Math.min(data.totalPages - 4, data.pageNumber - 2)) + i;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                                            style={p === data.pageNumber
                                                ? { background: "var(--primary)", color: "white" }
                                                : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }
                                            }
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!data.hasNextPage}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                                >
                                    {t('admin.reservations.pagination.next')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Detail Modal ── */}
            {selectedId && (
                <ReservationDetailModal
                    reservationId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onStatusUpdated={fetchData}
                />
            )}
        </main>
    );
}
