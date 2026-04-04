"use client";

import { TableMap2D, Layout } from "@/app/admin/tables/components/TableMap2D";
import { tableService, floorService, FloorLayoutTableItem } from "@/lib/services/tableService";
import { TableData } from "@/app/admin/tables/components/DraggableTable";
import { useTenant } from "@/lib/contexts/TenantContext";
import { useThemeMode } from "@/app/theme/AntdProvider";
import orderService, { OrderDto } from "@/lib/services/orderService";
import paymentService from "@/lib/services/paymentService";
import reservationService, { ReservationDetail } from "@/lib/services/reservationService";
import { message } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

interface ReservationDetailsViewProps {
  reservationId: string;
  mode: "admin" | "customer";
}

interface PanoramaTableImage {
  tableId: string;
  tableCode: string;
  imageUrl: string;
}

const statusColor: Record<string, string> = {
  PENDING: "var(--warning)",
  CONFIRMED: "var(--primary)",
  CHECKED_IN: "#8b5cf6",
  COMPLETED: "var(--success)",
  CANCELLED: "var(--danger)",
};

const statusBg: Record<string, string> = {
  PENDING: "var(--warning-soft)",
  CONFIRMED: "var(--primary-soft)",
  CHECKED_IN: "rgba(139,92,246,0.12)",
  COMPLETED: "var(--success-soft)",
  CANCELLED: "var(--danger-soft)",
};

const currency = (v?: number) => `${(v || 0).toLocaleString("vi-VN")}đ`;

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-md rounded-3xl p-8" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <div className="flex flex-col items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-full border-[3px] animate-spin"
            style={{ borderColor: "var(--primary-border)", borderTopColor: "var(--primary)" }}
          />
          <p className="text-sm font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>Loading reservation...</p>
        </div>
        <div className="space-y-3">
          <div className="h-4 rounded-full animate-pulse" style={{ background: "var(--surface)" }} />
          <div className="h-4 rounded-full animate-pulse w-5/6" style={{ background: "var(--surface)" }} />
          <div className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--surface)" }} />
        </div>
      </div>
    </div>
  );
}

// ── Timeline Step ─────────────────────────────────────────────────────────────
function TimelineStep({ label, done, active, isLast }: { label: string; done?: boolean; active?: boolean; isLast?: boolean }) {
  const color = done ? "var(--success)" : active ? "var(--primary)" : "var(--border)";
  return (
    <div className="relative flex flex-col items-center flex-1 min-w-0">
      {!isLast && (
        <div className="absolute top-5 left-1/2 w-full h-px" style={{ background: done || active ? "var(--primary)" : "var(--border)", zIndex: 0 }} />
      )}
      <div
        className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-500"
        style={{
          background: done ? "var(--success-soft)" : active ? "var(--primary-soft)" : "var(--surface)",
          border: `2px solid ${color}`,
          boxShadow: active ? `0 0 20px var(--primary-glow)` : "none",
        }}
      >
        {done ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: "var(--success)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : active ? (
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--primary)" }} />
        ) : (
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--border)" }} />
        )}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: done || active ? "var(--text)" : "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}

// ── Deposit Badge ─────────────────────────────────────────────────────────────
function DepositBadge({ paid, amount }: { paid: boolean; amount: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: paid ? "var(--success-soft)" : "var(--danger-soft)",
        color: paid ? "var(--success)" : "var(--danger)",
        border: `1px solid ${paid ? "var(--success-border)" : "var(--danger-border)"}`,
      }}
    >
      {paid ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )}
      {paid ? `${currency(amount)} - Paid` : `${currency(amount)} - Unpaid`}
    </span>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

// ── Order Panel ───────────────────────────────────────────────────────────────
function OrderPanel({ orders, firstTableId }: { orders: OrderDto[]; firstTableId?: string }) {
  const { t } = useTranslation();
  const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(to right, var(--primary-soft), var(--surface))", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>{t("reservation_detail.order.title")}</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{orders.length} {t("reservation_detail.order.orders_count")}</p>
          </div>
        </div>
        {orders.length > 0 && <span className="text-sm font-black tracking-wide" style={{ color: "var(--primary)" }}>{currency(totalAmount)}</span>}
      </div>

      <div className="p-5 space-y-3" style={{ background: "var(--card)" }}>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
              <svg className="w-6 h-6" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.order.no_orders")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order, i) => (
              <div key={order.id ?? i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>{i + 1}</div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{order.orderDetails?.length ?? 0} {t("reservation_detail.order.items")}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{currency(order.totalAmount)}</span>
              </div>
            ))}
          </div>
        )}

        {firstTableId && (
          <Link
            id="order-now-link"
            href={`/menu/${firstTableId}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all hover:brightness-110"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {t("reservation_detail.order.order_now")}
          </Link>
        )}
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.order.readonly_note")}</p>

        {orders.length > 0 && (
          <div className="rounded-xl p-3" style={{ background: "var(--warning-soft)", border: "1px solid var(--warning-border)" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--warning)" }}>
              {t("reservation_detail.order.payment_hint_title", "Payment reminder")}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {t("reservation_detail.order.payment_hint_desc", "Bạn có thể thanh toán đặt cọc trước để giữ bàn chắc chắn trong giờ cao điểm.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Table Map Card ─────────────────────────────────────────────────────────────
function TableMapCard({ detail }: { detail: ReservationDetail }) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!detail.tables || detail.tables.length === 0) return;
      setLoadingMap(true);
      try {
        const queryTime = detail.reservationDateTime || new Date().toISOString();
        const allFloors = await floorService.getAllFloors().catch(() => []);
        const activeFloors = allFloors.filter((f) => f.isActive !== false);
        if (activeFloors.length > 0) {
          const layoutResults = await Promise.allSettled(activeFloors.map((f) => floorService.getFloorLayout(f.id, queryTime)));
          const floors = activeFloors.map((floorSummary, idx) => {
            const layoutResult = layoutResults[idx];
            const layoutData = layoutResult.status === "fulfilled" ? layoutResult.value : null;
            const tableDataList: TableData[] = (layoutData?.tables ?? []).map((t: FloorLayoutTableItem) => ({
              id: t.id,
              tenantId: "default",
              name: t.code,
              seats: t.seatingCapacity,
              status: t.status === "3" || t.status?.toLowerCase() === "cleaning" ? "CLEANING"
                : t.status === "2" || t.status?.toLowerCase() === "occupied" ? "OCCUPIED"
                  : t.status === "1" || t.status?.toLowerCase() === "reserved" ? "RESERVED" : "AVAILABLE",
              area: floorSummary.name,
              position: { x: Number(t.layout.x), y: Number(t.layout.y) },
              shape: (t.layout.shape === "Round" || t.layout.shape === "Circle" ? "Circle"
                : t.layout.shape === "Square" ? "Square"
                  : t.layout.shape === "Oval" ? "Oval" : "Rectangle") as "Circle" | "Rectangle" | "Square" | "Oval",
              width: Number(t.layout.width) || 100,
              height: Number(t.layout.height) || 100,
              rotation: Number(t.layout.rotation) || 0,
              zoneId: floorSummary.name,
            }));
            return {
              id: floorSummary.id,
              name: floorSummary.name,
              width: Number(layoutData?.floor.width ?? floorSummary.width ?? 1400),
              height: Number(layoutData?.floor.height ?? floorSummary.height ?? 900),
              backgroundImage: layoutData?.floor.backgroundImageUrl ?? floorSummary.imageUrl ?? undefined,
              tables: tableDataList,
            };
          });
          const reservedTableIds = detail.tables.map((t) => t.id);
          const firstFloorId = floors.find((f) => f.tables.some((t) => reservedTableIds.includes(t.id)))?.id || floors[0]?.id || "";
          if (active) setLayout({ id: "be-layout", name: "Main Layout", activeFloorId: firstFloorId, floors });
        }
      } catch (err) {
        console.warn("Failed to load table layout", err);
      } finally {
        if (active) setLoadingMap(false);
      }
    }
    load();
    return () => { active = false; };
  }, [detail]);

  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ border: "1px solid var(--border)" }}>
      <div className="relative h-64" style={{ background: "var(--surface)" }}>
        {loadingMap ? (
          <div className="absolute inset-0 flex items-center justify-center gap-3" style={{ color: "var(--text-muted)" }}>
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary-border)", borderTopColor: "var(--primary)" }} />
            <span className="text-xs font-bold tracking-widest uppercase">Loading map...</span>
          </div>
        ) : layout ? (
          <div className="absolute inset-0 p-1 pointer-events-auto">
            <TableMap2D layout={layout} onLayoutChange={() => { }} onTableClick={() => { }} onTablePositionChange={() => { }} readOnly hideControls={true} focusOnSelected={true} selectedTableIds={detail.tables.map((t) => t.id)} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center p-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Map not available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ReservationDetailsView({ reservationId, mode: viewMode }: ReservationDetailsViewProps) {
  const router = useRouter();
  const { tenant } = useTenant();
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<OrderDto[]>([]);
  const [depositLoading, setDepositLoading] = useState(false);
  const [panoramaImage, setPanoramaImage] = useState<PanoramaTableImage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editDateTime, setEditDateTime] = useState("");
  const [editGuests, setEditGuests] = useState<number>(1);
  const [editSpecialRequests, setEditSpecialRequests] = useState("");

  const isCustomer = viewMode === "customer";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await reservationService.getReservationById(reservationId);
      setDetail(d);
      setEditDateTime(d.reservationDateTime ? d.reservationDateTime.slice(0, 16) : "");
      setEditGuests(d.numberOfGuests || 1);
      setEditSpecialRequests(d.specialRequests || "");

      if (d.tables?.length) {
        try {
          const firstTable = d.tables[0];
          const table = await tableService.getTableById(firstTable.id);
          const imageUrl = table.cubeFrontImageUrl || table.defaultViewUrl || "";
          setPanoramaImage(imageUrl ? { tableId: firstTable.id, tableCode: firstTable.code, imageUrl } : null);
        } catch {
          setPanoramaImage(null);
        }
      } else {
        setPanoramaImage(null);
      }

      if (isCustomer) {
        try {
          const orders = await orderService.getAllOrders();
          setRelatedOrders(orders.filter((o) => o.reservationId === d.id));
        } catch {
          setRelatedOrders([]);
        }
      }
    } catch (err) {
      console.error(err);
      setDetail(null);
      setPanoramaImage(null);
    } finally {
      setLoading(false);
    }
  }, [reservationId, isCustomer]);

  useEffect(() => { load(); }, [load]);

  const firstTableId = detail?.tables?.[0]?.id;
  const tenantAddress = [
    tenant?.businessAddressLine1,
    tenant?.businessAddressLine2,
    tenant?.businessAddressLine3,
    tenant?.businessAddressLine4,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
  const mapSearchUrl = tenantAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenantAddress)}`
    : "";
  const mapEmbedUrl = tenantAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(tenantAddress)}&output=embed`
    : "";

  const handlePayDeposit = async () => {
    const unpaid = relatedOrders.find((o) => o.paymentStatusId === 0);
    if (!unpaid?.id) { messageApi.warning(t("reservation_detail.deposit.no_order_warning")); return; }
    try {
      setDepositLoading(true);
      const res = await paymentService.createPaymentLink(unpaid.id);
      if (res.checkoutUrl) {
        window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        messageApi.success(t("reservation_detail.deposit.link_opened"));
      } else {
        messageApi.error(t("reservation_detail.deposit.link_error"));
      }
    } catch (err) {
      console.error(err);
      messageApi.error(t("reservation_detail.deposit.create_failed"));
    } finally {
      setDepositLoading(false);
    }
  };

  const handleToggleLanguage = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    messageApi.success(newLang === "vi" ? "Đã chuyển sang Tiếng Việt" : "Switched to English");
  };

  const handleCancelEdit = () => {
    if (!detail) return;
    setEditDateTime(detail.reservationDateTime ? detail.reservationDateTime.slice(0, 16) : "");
    setEditGuests(detail.numberOfGuests || 1);
    setEditSpecialRequests(detail.specialRequests || "");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!detail) return;

    const isLockedStatus = ["COMPLETED", "CANCELLED"].includes(detail.status.code);
    if (isLockedStatus) {
      messageApi.warning(t("reservation_detail.edit.locked_status", "Reservation đã hoàn tất hoặc đã hủy, không thể chỉnh sửa."));
      return;
    }

    if (!editDateTime) {
      messageApi.warning(t("reservation_detail.edit.date_required", "Vui lòng chọn thời gian"));
      return;
    }

    const selectedDate = new Date(editDateTime);
    if (Number.isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()) {
      messageApi.warning(t("reservation_detail.edit.date_in_past", "Thời gian đặt chỗ phải lớn hơn thời điểm hiện tại."));
      return;
    }

    const normalizedGuests = Math.max(1, Number(editGuests) || 1);
    const totalCapacity = (detail.tables || []).reduce((sum, tb) => sum + (tb.capacity || 0), 0);
    if (totalCapacity > 0 && normalizedGuests > totalCapacity) {
      messageApi.warning(
        t(
          "reservation_detail.edit.guests_exceed_capacity",
          `Số khách (${normalizedGuests}) vượt quá sức chứa bàn (${totalCapacity}).`
        )
      );
      return;
    }

    try {
      setSavingEdit(true);
      await reservationService.updateReservation(detail.id, {
        reservationDateTime: selectedDate.toISOString(),
        numberOfGuests: normalizedGuests,
        specialRequests: editSpecialRequests?.trim() || undefined,
      });
      messageApi.success(t("reservation_detail.edit.save_success", "Cập nhật reservation thành công"));
      setIsEditing(false);
      await load();
    } catch (err) {
      console.error(err);
      messageApi.error(t("reservation_detail.edit.save_failed", "Không thể cập nhật reservation"));
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <Spinner />;

  if (!detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: "var(--bg-base)" }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)" }}>
          <svg className="w-10 h-10" style={{ color: "var(--danger)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>{t("reservation_detail.not_found.title")}</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.not_found.description")}</p>
        </div>
        <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
          {t("reservation_detail.back")}
        </button>
      </div>
    );
  }

  const sColor = statusColor[detail.status.code] ?? "var(--text)";
  const sBg = statusBg[detail.status.code] ?? "var(--surface)";
  const reservationDate = new Date(detail.reservationDateTime);
  const allSteps = ["PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED"];
  const currIdx = allSteps.indexOf(detail.status.code);
  const isEditLocked = ["COMPLETED", "CANCELLED"].includes(detail.status.code);
  const hasTenantHeroBanner = Boolean(tenant?.backgroundUrl);
  const heroText = hasTenantHeroBanner ? "#F8FAFC" : "var(--text)";
  const heroTextMuted = hasTenantHeroBanner ? "rgba(248,250,252,0.82)" : "var(--text-muted)";
  const heroBorder = hasTenantHeroBanner ? "rgba(248,250,252,0.22)" : "var(--border)";
  const heroSurface = hasTenantHeroBanner ? "rgba(15,23,42,0.55)" : "var(--surface)";

  return (
    <main className="min-h-screen reservation-detail-page" style={{ background: "var(--bg-base)" }}>
      {contextHolder}

      {/* ── Hero Banner ───────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden reservation-hero-banner"
        style={{
          background: tenant?.backgroundUrl
            ? `url(${tenant.backgroundUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, var(--card)) 0%, var(--card) 65%)`,
        }}
      >
        {tenant?.backgroundUrl && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, rgba(8,12,24,0.72) 0%, rgba(8,12,24,0.58) 50%, rgba(8,12,24,0.78) 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.48) 100%)",
              }}
            />
          </>
        )}

        {/* Ambient orb */}
        <div className="reservation-hero-orb absolute -top-16 -right-16" />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: tenant?.backgroundUrl ? "linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent)" : "linear-gradient(to right, transparent, var(--primary-border), transparent)" }} />

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {/* Top Bar (Breadcrumb + Actions) */}
          <div className="flex items-center justify-between mb-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <button
                id="reservation-back-btn"
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-80"
                style={{ color: heroTextMuted }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {t("reservation_detail.back")}
              </button>
              <span style={{ color: heroBorder }}>/</span>
              <span className="text-xs font-medium" style={{ color: heroTextMuted }}>{t("reservation_detail.breadcrumb")}</span>
            </div>

            {/* Actions (Language & Theme) */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleLanguage}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all border"
                style={{ background: heroSurface, borderColor: heroBorder, color: hasTenantHeroBanner ? "#E2E8F0" : "var(--primary)", backdropFilter: hasTenantHeroBanner ? "blur(6px)" : undefined }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary-soft)"; e.currentTarget.style.borderColor = "var(--primary-border)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                title="Toggle Language"
              >
                <span className="text-[10px] font-bold uppercase">{i18n.language === "vi" ? "VI" : "EN"}</span>
              </button>
              
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all border"
                style={{ background: heroSurface, borderColor: heroBorder, color: hasTenantHeroBanner ? "#E2E8F0" : mode === "dark" ? "var(--gold)" : "var(--text-muted)", backdropFilter: hasTenantHeroBanner ? "blur(6px)" : undefined }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--warning-soft)"; e.currentTarget.style.borderColor = "var(--warning-border)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                title="Toggle Theme"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{mode === "dark" ? "light_mode" : "dark_mode"}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-8">
            {/* Left: title + badges */}
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.25em] font-bold mb-3" style={{ color: heroTextMuted }}>
                {t("reservation_detail.hero.label")}
              </p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 italic" style={{ color: heroText }}>
                #{detail.confirmationCode}
              </h1>
              <p className="text-sm mb-5" style={{ color: heroTextMuted }}>
                {t("reservation_detail.hero.created_at")} {new Date(detail.createdAt).toLocaleString("vi-VN")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                  style={{ color: sColor, background: sBg, borderColor: `${sColor}44` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sColor }} />
                  {detail.status.name}
                </span>
                <DepositBadge paid={detail.depositPaid} amount={detail.depositAmount} />
                {!detail.contact.isGuest && detail.contact.membershipLevel && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "color-mix(in srgb, var(--gold) 15%, transparent)", color: "var(--gold)", border: "1px solid color-mix(in srgb, var(--gold) 30%, transparent)" }}>
                    {detail.contact.membershipLevel}
                  </span>
                )}
              </div>
            </div>

            {/* Right: date-time chip + table badges */}
            <div className="flex flex-col items-end gap-4 shrink-0">
              <div className="flex items-center gap-5 px-6 py-5 rounded-2xl" style={{ background: hasTenantHeroBanner ? "rgba(15,23,42,0.58)" : "var(--card)", border: `1px solid ${heroBorder}`, boxShadow: "var(--shadow-md)", backdropFilter: hasTenantHeroBanner ? "blur(8px)" : undefined }}>
                <div className="text-center">
                  <p className="text-4xl font-black" style={{ color: "var(--primary)" }}>{reservationDate.getDate()}</p>
                  <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: heroTextMuted }}>
                    {reservationDate.toLocaleString("vi-VN", { month: "short" })} {reservationDate.getFullYear()}
                  </p>
                </div>
                <div className="w-px h-12" style={{ background: heroBorder }} />
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: heroText }}>
                    {reservationDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: heroTextMuted }}>{t("reservation_detail.hero.time_label")}</p>
                </div>
                <div className="w-px h-12" style={{ background: heroBorder }} />
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: heroText }}>{detail.numberOfGuests}</p>
                  <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: heroTextMuted }}>{t("reservation_detail.hero.guests_label")}</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {detail.tables.map((tbl) => (
                  <span key={tbl.id} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: hasTenantHeroBanner ? "rgba(15,23,42,0.52)" : "var(--primary-soft)", color: hasTenantHeroBanner ? "#E2E8F0" : "var(--primary)", border: `1px solid ${hasTenantHeroBanner ? "rgba(148,163,184,0.4)" : "var(--primary-border)"}`, backdropFilter: hasTenantHeroBanner ? "blur(6px)" : undefined }}>
                    {tbl.code} · {tbl.floorName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* ── Left Column (7/12) ─────────────────────────────────────────── */}
          <div className="xl:col-span-7 space-y-8 reservation-section-animate">

            {/* Status Timeline */}
            {detail.status.code !== "CANCELLED" && (
              <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-8" style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.timeline.title")}
                </p>
                <div className="flex justify-between items-start w-full">
                  {allSteps.map((step, i) => (
                    <TimelineStep
                      key={step}
                      label={t(`reservation_detail.timeline.${step.toLowerCase()}`)}
                      done={i < currIdx}
                      active={i === currIdx}
                      isLast={i === allSteps.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.customer.title")}</p>
                  <h3 className="text-xl font-black mt-1" style={{ color: "var(--text)" }}>{detail.contact.name}</h3>
                </div>
                {!detail.contact.isGuest && detail.contact.membershipLevel && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: "color-mix(in srgb, var(--gold) 12%, transparent)", color: "var(--gold)", border: "1px solid color-mix(in srgb, var(--gold) 25%, transparent)" }}>
                    {detail.contact.membershipLevel}
                  </span>
                )}
              </div>
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                label={t("reservation_detail.customer.phone")}
                value={detail.contact.phone}
              />
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                label={t("reservation_detail.customer.email")}
                value={detail.contact.email ?? "—"}
              />
              {!detail.contact.isGuest && detail.contact.loyaltyPoints !== null && (
                <InfoRow
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                  label={t("reservation_detail.customer.loyalty_points")}
                  value={`${detail.contact.loyaltyPoints?.toLocaleString() ?? 0} pts`}
                />
              )}
            </div>

            {/* Booking Details */}
            <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.booking.title")}</p>
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                label={t("reservation_detail.booking.date_time")}
                value={reservationDate.toLocaleString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              />
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label={t("reservation_detail.booking.guests")}
                value={`${detail.numberOfGuests} ${t("reservation_detail.booking.guests_unit")}`}
              />
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 6v12M14 6v12" /></svg>}
                label={t("reservation_detail.booking.tables")}
                value={detail.tables.map((tbl) => `${tbl.code} (${tbl.floorName})`).join(", ")}
              />
              {detail.specialRequests && (
                <div className="mt-4 rounded-xl p-4 flex items-start gap-3" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-1" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.booking.special_requests")}</p>
                    <p className="text-sm italic leading-relaxed" style={{ color: "var(--text)" }}>&ldquo;{detail.specialRequests}&rdquo;</p>
                  </div>
                </div>
              )}
            </div>

            {/* Floor Map */}
            <TableMapCard detail={detail} />

            {/* Admin note + edit */}
            {!isCustomer && (
              <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{t("reservation_detail.admin_note.title")}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.admin_note.description")}</p>
                    </div>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      disabled={isEditLocked}
                      className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid var(--primary-border)" }}
                      title={isEditLocked ? t("reservation_detail.edit.locked_status", "Reservation đã hoàn tất hoặc đã hủy, không thể chỉnh sửa.") : undefined}
                    >
                      {t("reservation_detail.edit.edit_btn", "Edit")}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingEdit}
                        className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                        style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                      >
                        {t("reservation_detail.edit.cancel_btn", "Cancel")}
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit || isEditLocked}
                        className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                      >
                        {savingEdit && <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                        {t("reservation_detail.edit.save_btn", "Save")}
                      </button>
                    </div>
                  )}
                </div>

                {isEditLocked && (
                  <div className="mb-4 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px dashed var(--border)" }}>
                    {t("reservation_detail.edit.locked_status", "Reservation đã hoàn tất hoặc đã hủy, không thể chỉnh sửa.")}
                  </div>
                )}

                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {t("reservation_detail.edit.date_time", "Date & time")}
                      </span>
                      <input
                        type="datetime-local"
                        value={editDateTime}
                        onChange={(e) => setEditDateTime(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {t("reservation_detail.edit.guests", "Guests")}
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={editGuests}
                        onChange={(e) => setEditGuests(Number(e.target.value) || 1)}
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                      />
                    </label>

                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {t("reservation_detail.edit.special_requests", "Special requests")}
                      </span>
                      <textarea
                        value={editSpecialRequests}
                        onChange={(e) => setEditSpecialRequests(e.target.value)}
                        rows={3}
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Column (5/12) ─────────────────────────────────────────── */}
          <div className="xl:col-span-5 space-y-6 reservation-section-animate" style={{ animationDelay: "0.1s" }}>

            {/* Confirmation Code */}
            <div
              className="rounded-2xl p-[1px] overflow-hidden"
              style={{ background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 30%, transparent))", boxShadow: "0 0 40px var(--primary-glow)" }}
            >
              <div className="rounded-2xl p-8 text-center relative overflow-hidden" style={{ background: "var(--card)" }}>
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ background: "var(--primary)", opacity: 0.05, filter: "blur(30px)" }} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.code.label")}
                </p>
                <div className="reservation-code-display mx-auto mb-3">
                  <span className="reservation-code-text">#{detail.confirmationCode}</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.code.description")}</p>
              </div>
            </div>

            {/* Order Section (customer only) */}
            {isCustomer && (
              <OrderPanel orders={relatedOrders} firstTableId={firstTableId} />
            )}

            {/* Deposit Status */}
            <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.deposit.label", "Deposit")}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: detail.depositPaid ? "var(--success)" : "var(--warning)", boxShadow: detail.depositPaid ? "0 0 8px var(--success)" : "none" }}
                    />
                    <p className="text-lg font-black" style={{ color: "var(--text)" }}>{currency(detail.depositAmount)}</p>
                  </div>
                </div>
                {isCustomer && !detail.depositPaid && (
                  <button
                    id="pay-deposit-btn"
                    onClick={handlePayDeposit}
                    disabled={depositLoading}
                    className="shrink-0 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-60 flex items-center gap-2"
                    style={{ background: "var(--success)", color: "#fff" }}
                  >
                    {depositLoading ? (
                      <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    )}
                    {depositLoading ? t("reservation_detail.deposit.creating_link") : t("reservation_detail.deposit.pay_now")}
                  </button>
                )}
                {!isCustomer && (
                  <span className="px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest opacity-50 cursor-default" style={{ background: "var(--surface)", color: detail.depositPaid ? "var(--success)" : "var(--danger)", border: `1px solid ${detail.depositPaid ? "var(--success-border)" : "var(--danger-border)"}` }}>
                    {detail.depositPaid ? "Paid" : "Unpaid"}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: detail.depositPaid ? "100%" : "20%", background: detail.depositPaid ? "var(--success)" : "var(--warning)" }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {detail.depositPaid
                    ? t("reservation_detail.deposit.paid_desc", "Khoản đặt cọc đã được thanh toán thành công.")
                    : t("reservation_detail.deposit.unpaid_desc", "Bạn chưa thanh toán đặt cọc. Hãy thanh toán sớm để giữ bàn.")}
                </p>
              </div>
            </div>

            {/* Panorama */}
            {panoramaImage && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                    {t("reservation_detail.booking.panorama", "Panorama")}
                  </p>
                </div>
                <div className="px-5 pb-5">
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                    <div className="px-3 py-2 text-xs font-semibold" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                      Table {panoramaImage.tableCode}
                    </div>
                    <img src={panoramaImage.imageUrl} alt={`Panorama table ${panoramaImage.tableCode}`} className="w-full h-40 object-cover" />
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {tenantAddress && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                <div className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    {tenant?.businessName && <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text)" }}>{tenant.businessName}</p>}
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{tenantAddress}</p>
                    <a
                      href={mapSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold mt-2 transition-all"
                      style={{ color: "var(--primary)" }}
                    >
                      {t("reservation_detail.help.get_directions")}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                    <iframe
                      title="restaurant-location-map"
                      src={mapEmbedUrl}
                      className="w-full h-64"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.meta.title")}</p>
              <div className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.meta.tables_count")}</span>
                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{detail.tables.length}</span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("reservation_detail.booking.last_updated")}</span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{new Date(detail.updatedAt).toLocaleString("vi-VN")}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
