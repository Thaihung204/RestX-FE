"use client";

import { useState, useEffect, useCallback } from "react";
import reservationService, {
    ReservationListItem,
    ReservationDetail,
    PaginatedReservations,
} from "@/lib/services/reservationService";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_ACTIONS: Record<
    string,
    { label: string; nextStatusId: number; color: string }[]
> = {
    PENDING: [
        { label: "Xác nhận", nextStatusId: 2, color: "var(--primary)" },
        { label: "Huỷ", nextStatusId: 5, color: "#ef4444" },
    ],
    CONFIRMED: [
        { label: "Check-in", nextStatusId: 3, color: "#3b82f6" },
        { label: "Huỷ", nextStatusId: 5, color: "#ef4444" },
    ],
    CHECKED_IN: [
        { label: "Hoàn thành", nextStatusId: 4, color: "#22c55e" },
    ],
    COMPLETED: [],
    CANCELLED: [],
};

const STATUS_SIDE_EFFECTS: Record<string, string> = {
    CONFIRMED: "Bàn sẽ được đánh dấu Reserved",
    CHECKED_IN: "Bàn chuyển sang Occupied, tạo TableSession",
    COMPLETED: "Bàn trả về Available, đóng TableSession",
    CANCELLED: "Bàn trả về Available",
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
    const [detail, setDetail] = useState<ReservationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ label: string; nextStatusId: number; color: string } | null>(null);

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
        if (!confirm("Huỷ nhanh reservation này?")) return;
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

    const actions = detail ? STATUS_ACTIONS[detail.status.code] ?? [] : [];

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
                            Chi tiết Đặt bàn
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
                        <p className="text-center" style={{ color: "var(--text-muted)" }}>Không tải được dữ liệu</p>
                    ) : (
                        <div className="space-y-6">
                            {/* Status + Actions */}
                            <div
                                className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                                style={{ background: "var(--surface)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Trạng thái:</span>
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
                                            {action.label}
                                        </button>
                                    ))}
                                    {(detail.status.code === "PENDING" || detail.status.code === "CONFIRMED") && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={actionLoading}
                                            className="px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50"
                                            style={{ borderColor: "#ef4444", color: "#ef4444" }}
                                        >
                                            Huỷ nhanh
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
                                        Xác nhận: <strong>{confirmAction.label}</strong>?
                                    </p>
                                    {STATUS_SIDE_EFFECTS[Object.keys(reservationService.STATUS_ID).find(k => reservationService.STATUS_ID[k as keyof typeof reservationService.STATUS_ID] === confirmAction.nextStatusId) ?? ""] && (
                                        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                                            ⚡ {STATUS_SIDE_EFFECTS[Object.keys(reservationService.STATUS_ID).find(k => reservationService.STATUS_ID[k as keyof typeof reservationService.STATUS_ID] === confirmAction.nextStatusId) ?? ""]}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(confirmAction.nextStatusId)}
                                            disabled={actionLoading}
                                            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white"
                                            style={{ background: confirmAction.color }}
                                        >
                                            {actionLoading ? "Đang xử lý..." : "Xác nhận"}
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction(null)}
                                            className="px-4 py-1.5 rounded-lg text-sm font-medium border"
                                            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                                        >
                                            Huỷ bỏ
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Info grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Contact */}
                                <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)" }}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                                        Thông tin liên hệ
                                    </p>
                                    <InfoRow label="Tên" value={detail.contact.name} />
                                    <InfoRow label="SĐT" value={detail.contact.phone} />
                                    <InfoRow label="Email" value={detail.contact.email ?? "—"} />
                                    <InfoRow label="Loại" value={detail.contact.isGuest ? "🏷️ Khách vãng lai" : "👤 Thành viên"} />
                                    {detail.contact.membershipLevel && (
                                        <InfoRow label="Hạng" value={detail.contact.membershipLevel} />
                                    )}
                                </div>

                                {/* Booking info */}
                                <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)" }}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                                        Thông tin đặt bàn
                                    </p>
                                    <InfoRow
                                        label="Ngày giờ"
                                        value={new Date(detail.reservationDateTime).toLocaleString("vi-VN")}
                                    />
                                    <InfoRow label="Số khách" value={`${detail.numberOfGuests} người`} />
                                    <InfoRow
                                        label="Bàn"
                                        value={detail.tables.map(t => `${t.code} (${t.floorName})`).join(", ")}
                                    />
                                    <InfoRow label="Đặt cọc" value={`${detail.depositAmount.toLocaleString("vi-VN")}đ`} />
                                    <InfoRow label="Đã cọc" value={detail.depositPaid ? "✅ Có" : "❌ Chưa"} />
                                </div>
                            </div>

                            {/* Special requests */}
                            {detail.specialRequests && (
                                <div className="rounded-xl p-4" style={{ background: "var(--surface)" }}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                                        Yêu cầu đặc biệt
                                    </p>
                                    <p className="text-sm italic" style={{ color: "var(--text)" }}>
                                        &ldquo;{detail.specialRequests}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                                <span>Tạo lúc: {new Date(detail.createdAt).toLocaleString("vi-VN")}</span>
                                {detail.checkedInAt && (
                                    <span>Check-in: {new Date(detail.checkedInAt).toLocaleString("vi-VN")}</span>
                                )}
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page khi filter thay đổi
    useEffect(() => {
        setPage(1);
    }, [search, statusId, date]);

    const statusOptions = [
        { id: 1, label: "Chờ xác nhận", color: "#FFA500" },
        { id: 2, label: "Đã xác nhận", color: "#3b82f6" },
        { id: 3, label: "Check-in", color: "#8b5cf6" },
        { id: 4, label: "Hoàn thành", color: "#22c55e" },
        { id: 5, label: "Đã huỷ", color: "#ef4444" },
    ];

    // Summary counts from current page (rough indicator)
    const pendingCount = data?.items.filter(i => i.status.code === "PENDING").length ?? 0;
    const confirmedCount = data?.items.filter(i => i.status.code === "CONFIRMED").length ?? 0;
    const checkinCount = data?.items.filter(i => i.status.code === "CHECKED_IN").length ?? 0;
    const totalCount = data?.totalCount ?? 0;

    return (
        <main className="flex-1 p-6 lg:p-8">
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
                            Quản lý Đặt bàn
                        </h2>
                        <p style={{ color: "var(--text-muted)" }}>
                            Tổng cộng {totalCount.toLocaleString("vi-VN")} reservation
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
                        Làm mới
                    </button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Tổng", value: totalCount, color: "var(--primary)", bg: "var(--primary-soft)" },
                        { label: "Chờ XN", value: pendingCount, color: "#FFA500", bg: "rgba(255,165,0,0.1)" },
                        { label: "Đã XN", value: confirmedCount, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
                        { label: "Check-in", value: checkinCount, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl p-4 flex items-center justify-between"
                            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                        >
                            <div>
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
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
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-2.5 w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm tên, SĐT, mã đặt bàn..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                            }}
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={statusId}
                        onChange={(e) => setStatusId(e.target.value === "" ? "" : Number(e.target.value))}
                        className="px-3 py-2 rounded-lg text-sm outline-none min-w-[160px]"
                        style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                        }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        {statusOptions.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>

                    {/* Date filter */}
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                        }}
                    />

                    {/* Clear filters */}
                    {(search || statusId !== "" || date) && (
                        <button
                            onClick={() => { setSearch(""); setStatusId(""); setDate(""); }}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                            Xoá filter
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
                                    {["Mã đặt bàn", "Khách hàng", "Bàn / Tầng", "Ngày & Giờ", "Số khách", "Trạng thái", "Khách vãng lai", "Thao tác"].map((col) => (
                                        <th
                                            key={col}
                                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            {col}
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
                                                <p className="text-sm">Không có reservation nào</p>
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
                                            {/* Confirmation code */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-mono text-sm font-bold" style={{ color: "var(--primary)" }}>
                                                    #{item.confirmationCode}
                                                </span>
                                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                                </p>
                                            </td>

                                            {/* Contact */}
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

                                            {/* Tables */}
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

                                            {/* DateTime */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                                                    {new Date(item.reservationDateTime).toLocaleDateString("vi-VN", {
                                                        day: "2-digit", month: "2-digit", year: "numeric"
                                                    })}
                                                </p>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    {new Date(item.reservationDateTime).toLocaleTimeString("vi-VN", {
                                                        hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </p>
                                            </td>

                                            {/* Guests */}
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

                                            {/* Status */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge {...item.status} />
                                            </td>

                                            {/* isGuest */}
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <span className="text-sm">
                                                    {item.isGuest ? "🏷️" : "👤"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedId(item.id)}
                                                    className="p-2 rounded-lg transition-all"
                                                    style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                                                    title="Xem chi tiết & thao tác"
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
                                Trang {data.pageNumber} / {data.totalPages} · {data.totalCount} kết quả
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!data.hasPreviousPage}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                                >
                                    ← Trước
                                </button>
                                {/* Page numbers */}
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
                                    Sau →
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
