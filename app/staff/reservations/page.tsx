"use client";

import { ReservationRowActions } from "@/components/admin/reservations/ReservationRowActions";
import { DayPicker } from '@/components/ui/DayPicker';
import orderSignalRService from "@/lib/services/orderSignalRService";
import reservationService, {
    PaginatedReservations,
    ReservationDetail,
    ReservationListItem,
    ReservationStatus,
} from "@/lib/services/reservationService";
import { tenantService } from "@/lib/services/tenantService";
import { formatVND } from "@/lib/utils/currency";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { HubConnectionState } from "@microsoft/signalr";
import { Select, message } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";


const STATUS_FLOW_ORDER: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  CHECKED_IN: 2,
  COMPLETED: 3,
  CANCELLED: 99,
  NO_SHOW: 99,
  NOSHOW: 99,
};

// ─── Badge component ──────────────────────────────────────────────────────────
function StatusBadge({
  code,
  name,
  colorCode,
}: {
  code: string;
  name: string;
  colorCode: string;
}) {
  const { t } = useTranslation();
  const finalColorCode = code === "CONFIRMED" ? "#3b82f6" : colorCode;
  const bg = finalColorCode ? `${finalColorCode}22` : "rgba(255,255,255,0.08)";
  const fallbackName = name || code;
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
      style={{
        color: finalColorCode,
        backgroundColor: bg,
        borderColor: `${finalColorCode}44`,
      }}
    >
      {code
        ? t(`admin.reservations.status.${code.toLowerCase()}`, {
          defaultValue: fallbackName,
        })
        : fallbackName}
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
  const [allStatuses, setAllStatuses] = useState<ReservationStatus[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | "">("");

  useEffect(() => {
    reservationService
      .getReservationStatuses()
      .then(setAllStatuses)
      .catch(console.error);
  }, []);

  useEffect(() => {
    reservationService
      .getReservationById(reservationId)
      .then((d) => {
        setDetail(d);
        setSelectedStatusId(d.status.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reservationId]);
  const cancelledStatusId = allStatuses.find((s) => s.code === "CANCELLED")?.id;

  // Define the logical order of statuses for enabling/disabling
  const STATUS_FLOW_ORDER: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    CHECKED_IN: 2,
    COMPLETED: 3,
    CANCELLED: 99,
    NO_SHOW: 99,
    NOSHOW: 99,
  };

  const currentFlowOrder =
    STATUS_FLOW_ORDER[detail?.status?.code?.toUpperCase() ?? ""] ?? 0;
  const isTerminalStatus = [
    "CANCELLED",
    "NO_SHOW",
    "NOSHOW",
    "COMPLETED",
  ].includes(detail?.status?.code?.toUpperCase() ?? "");

  const handleStatusChange = async (newStatusId: number) => {
    if (!detail || newStatusId === detail.status.id) return;

    const selectedStatus = allStatuses.find((s) => s.id === newStatusId);
    if (selectedStatus?.code !== "CANCELLED") {
      message.warning(
        t("admin.reservations.messages.update_status_failed", {
          defaultValue: "Chỉ hỗ trợ hủy đặt bàn từ danh sách trạng thái",
        }),
      );
      setSelectedStatusId(detail.status.id);
      return;
    }

    const confirmed = window.confirm(
      t("admin.reservations.modal.confirm_action", {
        action: t("admin.reservations.actions.cancel", { defaultValue: "Hủy" }),
      }),
    );
    if (!confirmed) {
      setSelectedStatusId(detail.status.id);
      return;
    }

    setActionLoading(true);
    try {
      await reservationService.updateReservationStatus(
        reservationId,
        newStatusId,
      );
      message.success(
        t("admin.reservations.messages.status_updated", {
          defaultValue: "Đã cập nhật trạng thái",
        }),
      );
      onStatusUpdated();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(
        t("admin.reservations.messages.update_status_failed", {
          defaultValue: "Không thể cập nhật trạng thái đặt bàn",
        }),
      );
      setSelectedStatusId(detail.status.id);
    } finally {
      setActionLoading(false);
    }
  };

  const now = new Date();
  const canCheckIn =
    detail?.status.code === "CONFIRMED" &&
    !detail.checkedInAt &&
    isSameLocalDate(
      detail.reservationDateTime,
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

  const handleCheckIn = async () => {
    if (!detail || !canCheckIn) return;
    setActionLoading(true);
    try {
      await reservationService.checkInReservation(detail.confirmationCode);
      message.success(
        t("admin.reservations.messages.checkin_success", {
          defaultValue: "Check-in thành công",
        }),
      );
      onStatusUpdated();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(
        t("admin.reservations.messages.checkin_failed", {
          defaultValue: "Không thể check-in đặt bàn",
        }),
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
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
              {t("admin.reservations.modal.title")}
            </h2>
            {detail && (
              <span
                className="text-sm font-mono"
                style={{ color: "var(--primary)" }}
              >
                #{detail.confirmationCode}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--surface)", color: "var(--text-muted)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{
                  borderColor: "var(--primary)",
                  borderTopColor: "transparent",
                }}
              />
            </div>
          ) : !detail ? (
            <p className="text-center" style={{ color: "var(--text-muted)" }}>
              {t("admin.reservations.modal.load_error")}
            </p>
          ) : (
            <div className="space-y-6">
              {/* Status + Actions */}
              <div
                className="rounded-xl p-4 flex flex-wrap items-center gap-3"
                style={{ background: "var(--surface)" }}
              >
                <span
                  className="text-sm font-medium shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("admin.reservations.modal.status_label")}
                </span>
                <Select
                  value={selectedStatusId !== "" ? selectedStatusId : undefined}
                  disabled={
                    actionLoading ||
                    allStatuses.length === 0 ||
                    isTerminalStatus
                  }
                  loading={actionLoading}
                  onChange={(val: number) => handleStatusChange(val)}
                  style={{ minWidth: 180 }}
                  optionLabelProp="label"
                  options={allStatuses.map((s) => {
                    const color =
                      s.code === "CONFIRMED" ? "#3b82f6" : s.colorCode;
                    const label = t(
                      `admin.reservations.status.${s.code.toLowerCase()}`,
                      { defaultValue: s.name },
                    );
                    const statusOrder =
                      STATUS_FLOW_ORDER[s.code?.toUpperCase() ?? ""] ?? 0;
                    const isPast =
                      statusOrder < currentFlowOrder &&
                      s.id !== detail.status.id;
                    const isDisabled =
                      isPast ||
                      isTerminalStatus ||
                      (s.code !== "CANCELLED" && s.id !== detail.status.id);
                    return {
                      value: s.id,
                      disabled: isDisabled,
                      label: (
                        <span
                          style={{
                            color: isPast ? "var(--text-muted)" : color,
                            fontWeight: 600,
                            fontSize: 13,
                            opacity: isPast ? 0.45 : 1,
                          }}
                        >
                          {label}
                        </span>
                      ),
                      rawlabel: label,
                      color,
                      isPast,
                    };
                  })}
                  optionRender={(opt: any) => (
                    <div
                      className="flex items-center gap-2"
                      style={{ opacity: opt.data.isPast ? 0.4 : 1 }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: (opt.data as any).color }}
                      />
                      <span
                        style={{
                          color: opt.data.isPast
                            ? "var(--text-muted)"
                            : (opt.data as any).color,
                          fontWeight: 600,
                        }}
                      >
                        {(opt.data as any).rawlabel}
                      </span>
                    </div>
                  )}
                />
                {canCheckIn && (
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    style={{
                      background: "var(--primary)",
                      color: "#fff",
                    }}
                  >
                    {t("admin.reservations.actions.checkin")}
                  </button>
                )}
                {detail.checkedInAt && (
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
                    style={{
                      background: "rgba(34, 197, 94, 0.1)",
                      color: "#22c55e",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                    }}
                    title={t("admin.reservations.checked_in_at") + " " + new Date(detail.checkedInAt).toLocaleTimeString()}
                  >
                    {t("admin.reservations.checked_in")} {new Date(detail.checkedInAt).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact */}
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: "var(--surface)" }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t("admin.reservations.modal.contact_title")}
                  </p>
                  <InfoRow
                    label={t("admin.reservations.modal.contact.name")}
                    value={detail.contact.name}
                  />
                  <InfoRow
                    label={t("admin.reservations.modal.contact.phone")}
                    value={detail.contact.phone}
                  />
                  <InfoRow
                    label={t("admin.reservations.modal.contact.email")}
                    value={detail.contact.email ?? "—"}
                  />
                  <InfoRow
                    label={t("admin.reservations.modal.contact.type")}
                    value={
                      detail.contact.isGuest
                        ? t("admin.reservations.modal.contact.guest")
                        : t("admin.reservations.modal.contact.member")
                    }
                  />
                  {detail.contact.membershipLevel && (
                    <InfoRow
                      label={t("admin.reservations.modal.contact.level")}
                      value={detail.contact.membershipLevel}
                    />
                  )}
                </div>

                {/* Booking info */}
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: "var(--surface)" }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t("admin.reservations.modal.booking_title")}
                  </p>
                  <InfoRow
                    label={t("admin.reservations.modal.booking.date_time")}
                    value={new Date(
                      detail.reservationDateTime,
                    ).toLocaleString()}
                  />
                  <InfoRow
                    label={t("admin.reservations.modal.booking.guests")}
                    value={`${detail.numberOfGuests} ${t("admin.reservations.modal.booking.guests_suffix")}`}
                  />
                  <InfoRow
                    label={t("admin.reservations.modal.booking.table")}
                    value={detail.tables
                      .map((t) => `${t.code} (${t.floorName})`)
                      .join(", ")}
                  />
                  <InfoRow
                    label={t("admin.reservations.modal.booking.deposit")}
                    value={formatVND(detail.depositAmount)}
                  />
                  <InfoRow
                    label={t("admin.reservations.modal.booking.deposit_paid")}
                    value={
                      detail.depositPaid
                        ? t("admin.reservations.modal.booking.deposit_yes")
                        : t("admin.reservations.modal.booking.deposit_no")
                    }
                  />
                </div>
              </div>

              {/* Special requests */}
              {detail.specialRequests && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--surface)" }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t("admin.reservations.modal.special_requests")}
                  </p>
                  <p
                    className="text-sm italic"
                    style={{ color: "var(--text)" }}
                  >
                    &ldquo;{detail.specialRequests}&rdquo;
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div
                className="flex flex-wrap gap-4 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <span>
                  {t("admin.reservations.modal.created_at")}{" "}
                  {new Date(detail.createdAt).toLocaleString()}
                </span>
                {detail.checkedInAt &&
                  ["CHECKED_IN", "COMPLETED"].includes(detail.status.code) && (
                    <span style={{ color: "#8b5cf6" }}>
                      {t("admin.reservations.checked_in_at")} {new Date(detail.checkedInAt).toLocaleString()}
                    </span>
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
      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span
        className="text-xs font-medium text-right"
        style={{ color: "var(--text)" }}
      >
        {value}
      </span>
    </div>
  );
}

const isSameLocalDate = (
  value: string | Date,
  y: number,
  m: number,
  d: number,
) => {
  const dt = new Date(value);
  return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReservationsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedReservations | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Filters
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState<number | "">("");
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reservationService.getReservations({
        pageNumber: page,
        pageSize: 10,
        search: search || undefined,
        statusId: statusId !== "" ? statusId : undefined,
        date: todayDate,
      });
      const todayItems = result.items.filter((item) =>
        isSameLocalDate(
          item.reservationDateTime,
          todayYear,
          todayMonth,
          todayDay,
        ),
      );
      setData({
        ...result,
        items: todayItems,
        totalCount: todayItems.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusId, todayDate, todayDay, todayMonth, todayYear]);

  const handleReservationStatusChange = useCallback(
    async (reservationId: string, newStatusId: number, currentStatusId: number) => {
      if (newStatusId === currentStatusId) return;

      try {
        await reservationService.updateReservationStatus(reservationId, newStatusId);
        message.success(
          t("admin.reservations.messages.status_updated", {
            defaultValue: "Đã cập nhật trạng thái",
          }),
        );
        fetchData();
      } catch (e) {
        console.error(e);
        message.error(
          extractApiErrorMessage(
            e,
            t("admin.reservations.messages.update_status_failed", {
              defaultValue: "Không thể cập nhật trạng thái đặt bàn",
            }),
          ),
        );
      }
    },
    [fetchData, t],
  );

  const [statuses, setStatuses] = useState<ReservationStatus[]>([]);
  const [globalStats, setGlobalStats] = useState<{
    total: number;
    byStatus: Record<number, number>;
  }>({ total: 0, byStatus: {} });

  const fetchStats = useCallback(async () => {
    if (statuses.length === 0) return;
    try {
      const baseParams: any = { pageSize: 1, date: todayDate };
      if (search) baseParams.search = search;

      const resTotal = await reservationService.getReservations(baseParams);
      const statsMap: Record<number, number> = {};

      const promises = statuses.map((s) =>
        reservationService
          .getReservations({ ...baseParams, statusId: s.id })
          .then((res) => {
            statsMap[s.id] = res.totalCount;
          })
          .catch(() => { }),
      );
      await Promise.all(promises);

      setGlobalStats({ total: resTotal.totalCount, byStatus: statsMap });
    } catch (e) {
      console.error(e);
    }
  }, [search, todayDate, statuses]);

  // Keep refs in sync so SignalR handlers always use latest callbacks/values
  // without needing to re-register (which would cause reconnect on filter change)
  const fetchDataRef = useRef(fetchData);
  const fetchStatsRef = useRef(fetchStats);
  const searchRef = useRef(search);
  const statusIdRef = useRef(statusId);
  const todayYearRef = useRef(todayYear);
  const todayMonthRef = useRef(todayMonth);
  const todayDayRef = useRef(todayDay);

  useEffect(() => { fetchDataRef.current = fetchData; }, [fetchData]);
  useEffect(() => { fetchStatsRef.current = fetchStats; }, [fetchStats]);
  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { statusIdRef.current = statusId; }, [statusId]);
  useEffect(() => { todayYearRef.current = todayYear; }, [todayYear]);
  useEffect(() => { todayMonthRef.current = todayMonth; }, [todayMonth]);
  useEffect(() => { todayDayRef.current = todayDay; }, [todayDay]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    setPage(1);
  }, [search, statusId]);
  useEffect(() => {
    reservationService
      .getReservationStatuses()
      .then(setStatuses)
      .catch(console.error);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchTenant = async () => {
      try {
        const host = window.location.host;
        const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;

        if (
          hostWithoutPort === "localhost" ||
          hostWithoutPort === "127.0.0.1" ||
          hostWithoutPort === "staff.localhost"
        ) {
          const data = await tenantService.getTenantConfig("demo.restx.food");
          if (isMounted) setTenantId(data?.id || "");
          return;
        }

        if (hostWithoutPort.endsWith(".localhost")) {
          const subdomain = hostWithoutPort.replace(".localhost", "");
          const tenantHost =
            subdomain && subdomain !== "staff"
              ? `${subdomain}.restx.food`
              : "demo.restx.food";
          const data = await tenantService.getTenantConfig(tenantHost);
          if (isMounted) setTenantId(data?.id || "");
          return;
        }

        const data = await tenantService.getTenantConfig(hostWithoutPort);
        if (isMounted) setTenantId(data?.id || "");
      } catch (error) {
        console.error("Failed to resolve tenant for staff reservations:", error);
      }
    };

    fetchTenant();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;
    const debounceTimerRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

    const handleReservationCreated = async (payload: any) => {
      if (!isMounted) return;
      const changedTenantId = payload?.tenantId || payload?.reservation?.tenantId;
      if (changedTenantId && changedTenantId !== tenantId) return;

      const reservationId =
        payload?.reservationId || payload?.id || payload?.reservation?.id;
      if (!reservationId) return;

      try {
        const reservation = await reservationService.getReservationById(String(reservationId));
        if (!isMounted) return;

        // Staff page only shows today's reservations — skip if not today
        if (
          !isSameLocalDate(
            reservation.reservationDateTime,
            todayYearRef.current,
            todayMonthRef.current,
            todayDayRef.current,
          )
        ) return;

        // Update stats counter without full reload
        setGlobalStats((prev) => ({
          total: prev.total + 1,
          byStatus: {
            ...prev.byStatus,
            [reservation.status.id]: (prev.byStatus[reservation.status.id] || 0) + 1,
          },
        }));

        // Apply search/status filters before inserting
        if (searchRef.current) {
          const q = searchRef.current.trim().toLowerCase();
          const matches =
            reservation.confirmationCode.toLowerCase().includes(q) ||
            reservation.contact.name.toLowerCase().includes(q) ||
            reservation.contact.phone.toLowerCase().includes(q);
          if (!matches) return;
        }
        if (statusIdRef.current !== "" && reservation.status.id !== statusIdRef.current) return;

        const nextItem: ReservationListItem = {
          id: reservation.id,
          confirmationCode: reservation.confirmationCode,
          tables: reservation.tables,
          reservationDateTime: reservation.reservationDateTime,
          checkedInAt: reservation.checkedInAt,
          numberOfGuests: reservation.numberOfGuests,
          contactName: reservation.contact.name,
          contactPhone: reservation.contact.phone,
          customer: reservation.contact.customerId
            ? { customerId: reservation.contact.customerId }
            : undefined,
          isGuest: reservation.contact.isGuest,
          status: reservation.status,
          depositAmount: reservation.depositAmount,
          depositPaid: reservation.depositPaid,
          paymentDeadline: reservation.paymentDeadline,
          checkoutUrl: reservation.checkoutUrl,
          createdAt: reservation.createdAt,
        };

        setData((prev) => {
          if (!prev) return prev;
          if (prev.items.some((item) => item.id === nextItem.id)) return prev;

          const nextItems = [...prev.items, nextItem].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          );

          return {
            ...prev,
            items: nextItems,
            totalCount: prev.totalCount + 1,
          };
        });
      } catch (error) {
        console.error("Failed to sync created reservation:", error);
        fetchDataRef.current();
        fetchStatsRef.current();
      }
    };

    const handleReservationChanged = (payload: any) => {
      if (!isMounted) return;
      const changedTenantId =
        payload?.tenantId || payload?.reservation?.tenantId;
      if (changedTenantId && changedTenantId !== tenantId) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        fetchDataRef.current();
        fetchStatsRef.current();
      }, 300);
    };

    const setupSignalR = async () => {
      try {
        await orderSignalRService.start();
        if (!isMounted) return;

        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.joinTenantGroup(tenantId);
          if (!isMounted) return;

          orderSignalRService.on("reservations.created", handleReservationCreated);
          ["reservations.updated", "tables.status_changed", "deposits.confirmed"].forEach((event) =>
            orderSignalRService.on(event, handleReservationChanged),
          );
        }
      } catch (error) {
        console.error("SignalR: setup reservations failed", error);
      }
    };

    setupSignalR();

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      orderSignalRService.off("reservations.created", handleReservationCreated);
      ["reservations.updated", "tables.status_changed", "deposits.confirmed"].forEach((event) =>
        orderSignalRService.off(event, handleReservationChanged),
      );
      orderSignalRService.leaveTenantGroup(tenantId).catch(() => { });
    };
  }, [tenantId]);

  useEffect(() => {
    const timer = setInterval(
      () => {
        if (
          typeof document !== "undefined" &&
          document.visibilityState === "visible"
        ) {
          fetchData();
        }
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(timer);
  }, [fetchData]);

  const totalCount = data?.totalCount ?? 0;

  const tableHeaderKeys = [
    "code",
    "customer",
    "table_floor",
    "date_time",
    "guests",
    "status",
    "actions",
  ] as const;

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2
              className="text-3xl font-bold mb-1"
              style={{ color: "var(--text)" }}
            >
              {t("admin.reservations.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("admin.reservations.total_count", {
                total: totalCount.toLocaleString(),
              })}
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="flex flex-wrap gap-4">
          <div
            className="flex-1 min-w-[200px] rounded-xl p-4 flex items-center justify-between"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t(`admin.reservations.stats.total`, {
                  defaultValue: "Tổng cộng",
                })}
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ color: "var(--primary)" }}
              >
                {globalStats.total}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary-soft)" }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: "var(--primary)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          {statuses.map((s) => {
            const count = globalStats.byStatus[s.id] || 0;
            const finalColor =
              s.code === "CONFIRMED"
                ? "#3b82f6"
                : s.colorCode || "var(--primary)";
            const bg = `${finalColor}18`;
            return (
              <div
                key={s.id}
                className="flex-1 min-w-[200px] rounded-xl p-4 flex items-center justify-between"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <p
                    className="text-sm truncate w-[80px] xl:w-[100px]"
                    style={{ color: "var(--text-muted)" }}
                    title={t(
                      `admin.reservations.status.${s.code.toLowerCase()}`,
                      { defaultValue: s.name },
                    )}
                  >
                    {t(`admin.reservations.status.${s.code.toLowerCase()}`, {
                      defaultValue: s.name,
                    })}
                  </p>
                  <p
                    className="text-2xl font-bold mt-1"
                    style={{ color: finalColor }}
                  >
                    {count}
                  </p>
                </div>
                <div
                  className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: bg }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: finalColor }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div
          className="rounded-xl p-4 flex flex-wrap gap-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-2.5 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-[14px] py-[10px] rounded-xl text-[14px] outline-none transition-colors"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          <select
            value={statusId}
            onChange={(e) =>
              setStatusId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="px-[14px] py-[10px] rounded-xl text-[14px] outline-none min-w-[160px] transition-colors"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <option value="">
              {t("admin.reservations.filter.all_status")}
            </option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {t(`admin.reservations.status.${s.code.toLowerCase()}`, {
                  defaultValue: s.name,
                })}
              </option>
            ))}
          </select>

          <div className="flex-1 min-w-[200px] opacity-80">
            <DayPicker
              value={dayjs(todayDate)}
              onChange={() => { }}
              disabled
              placeholder={t("admin.reservations.filter.date_placeholder", { defaultValue: "Chọn ngày" })}
            />
          </div>

          {(search || statusId !== "") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusId("");
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {t("admin.reservations.filter.clear")}
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full hidden md:table">
              <thead style={{ background: "var(--surface)" }}>
                <tr>
                  {tableHeaderKeys.map((key) => (
                    <th
                      key={key}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${["table_floor", "guests", "status", "actions"].includes(
                        key,
                      )
                        ? "text-center"
                        : "text-left"
                        }`}
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
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex justify-center">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                          style={{
                            borderColor: "var(--primary)",
                            borderTopColor: "transparent",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ) : !data?.items.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-12 h-12 opacity-30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-sm">
                          {t("admin.reservations.empty")}
                        </p>
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
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--primary)" }}
                        >
                          #{item.confirmationCode}
                        </span>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
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
                            <div className="flex items-center gap-2 mb-0.5">
                              <p
                                className="text-sm font-medium"
                                style={{ color: "var(--text)" }}
                              >
                                {item.contactName}
                              </p>
                              {item.isGuest ? (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    background: "var(--surface)",
                                    color: "var(--text-muted)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  {t("admin.reservations.modal.contact.guest")}
                                </span>
                              ) : (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    background: "rgba(234, 179, 8, 0.1)",
                                    color: "#eab308",
                                    border: "1px solid rgba(234, 179, 8, 0.2)",
                                  }}
                                >
                                  {t("admin.reservations.modal.contact.member")}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {item.contactPhone}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-center gap-1.5 max-w-[180px] mx-auto">
                          {item.tables.map((t, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded flex items-center gap-1 text-[11px] font-medium"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                              }}
                            >
                              {t.code}{" "}
                              <span style={{ color: "var(--text-muted)" }}>
                                · {t.floorName}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {new Date(
                            item.reservationDateTime,
                          ).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(
                            item.reservationDateTime,
                          ).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: "var(--surface)",
                            color: "var(--text)",
                          }}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {item.numberOfGuests}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          {(() => {
                            const rawColor =
                              item.status.code === "CONFIRMED"
                                ? "#3b82f6"
                                : item.status.colorCode || "#3b82f6";
                            const currentColor = /^#([\da-f]{3}|[\da-f]{6})$/i.test(rawColor)
                              ? rawColor
                              : "#3b82f6";
                            const badgeBackground = `${currentColor}1A`;
                            const badgeBorder = `${currentColor}33`;
                            const currentFlowOrder =
                              STATUS_FLOW_ORDER[item.status?.code?.toUpperCase() ?? ""] ??
                              0;

                            return (
                              <select
                                className="pl-3 pr-8 py-1 rounded-full text-[13px] font-semibold border cursor-pointer outline-none transition-colors appearance-none text-center"
                                style={{
                                  backgroundColor: badgeBackground,
                                  borderColor: badgeBorder,
                                  color: currentColor,
                                  textAlignLast: "center",
                                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(currentColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 0.6rem center",
                                  backgroundSize: "1em",
                                }}
                                value={String(item.status.id)}
                                onChange={(e) =>
                                  handleReservationStatusChange(
                                    item.id,
                                    Number(e.target.value),
                                    item.status.id,
                                  )
                                }
                              >
                                {statuses
                                  .filter((status) => status.code !== "CHECKED_IN")
                                  .map((status) => {
                                    const label = t(
                                      `admin.reservations.status.${status.code.toLowerCase()}`,
                                      { defaultValue: status.name },
                                    );
                                    const statusOrder =
                                      STATUS_FLOW_ORDER[status.code?.toUpperCase() ?? ""] ??
                                      0;
                                    const isPast =
                                      statusOrder < currentFlowOrder &&
                                      status.id !== item.status.id;

                                    return (
                                      <option
                                        key={status.id}
                                        value={status.id}
                                        disabled={isPast}
                                        style={{
                                          color: "var(--text)",
                                          background: "var(--card)",
                                        }}
                                      >
                                        {label}
                                      </option>
                                    );
                                  })}
                              </select>
                            );
                          })()}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <ReservationRowActions
                            item={item}
                            onActionComplete={fetchData}
                            onViewDetail={() => setSelectedId(item.id)}
                            restrictToToday
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ── Mobile Layout ── */}
            <div
              className="grid grid-cols-1 gap-4 p-4 md:hidden"
              style={{ background: "var(--surface-subtle)" }}
            >
              {loading ? (
                <div className="py-16 flex justify-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "var(--primary)" }}
                  />
                </div>
              ) : !data?.items.length ? (
                <div
                  className="py-16 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 opacity-30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm">{t("admin.reservations.empty")}</p>
                  </div>
                </div>
              ) : (
                data.items.map((item: ReservationListItem) => (
                  <div
                    key={item.id}
                    className="rounded-xl p-4 shadow-sm"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {/* Header: Code & Status */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--primary)" }}
                        >
                          #{item.confirmationCode}
                        </span>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(
                            item.reservationDateTime,
                          ).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}{" "}
                          lúc{" "}
                          {new Date(
                            item.reservationDateTime,
                          ).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {(() => {
                        const rawColor =
                          item.status.code === "CONFIRMED"
                            ? "#3b82f6"
                            : item.status.colorCode || "#3b82f6";
                        const currentColor = /^#([\da-f]{3}|[\da-f]{6})$/i.test(rawColor)
                          ? rawColor
                          : "#3b82f6";
                        const badgeBackground = `${currentColor}1A`;
                        const badgeBorder = `${currentColor}33`;
                        const currentFlowOrder =
                          STATUS_FLOW_ORDER[item.status?.code?.toUpperCase() ?? ""] ??
                          0;

                        return (
                          <select
                            className="pl-3 pr-8 py-1 rounded-full text-[13px] font-semibold border cursor-pointer outline-none transition-colors appearance-none text-center"
                            style={{
                              backgroundColor: badgeBackground,
                              borderColor: badgeBorder,
                              color: currentColor,
                              textAlignLast: "center",
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(currentColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 0.6rem center",
                              backgroundSize: "1em",
                            }}
                            value={String(item.status.id)}
                            onChange={(e) =>
                              handleReservationStatusChange(
                                item.id,
                                Number(e.target.value),
                                item.status.id,
                              )
                            }
                          >
                            {statuses
                              .filter((status) => status.code !== "CHECKED_IN")
                              .map((status) => {
                                const label = t(
                                  `admin.reservations.status.${status.code.toLowerCase()}`,
                                  { defaultValue: status.name },
                                );
                                const statusOrder =
                                  STATUS_FLOW_ORDER[status.code?.toUpperCase() ?? ""] ??
                                  0;
                                const isPast =
                                  statusOrder < currentFlowOrder &&
                                  status.id !== item.status.id;

                                return (
                                  <option
                                    key={status.id}
                                    value={status.id}
                                    disabled={isPast}
                                    style={{
                                      color: "var(--text)",
                                      background: "var(--card)",
                                    }}
                                  >
                                    {label}
                                  </option>
                                );
                              })}
                          </select>
                        );
                      })()}
                    </div>

                    {/* Customer */}
                    <div
                      className="flex items-center gap-3 mb-3 pb-3"
                      style={{ borderBottom: "1px dashed var(--border)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                        style={{ background: "var(--primary)" }}
                      >
                        {item.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-bold"
                            style={{ color: "var(--text)" }}
                          >
                            {item.contactName}
                          </p>
                          {item.isGuest ? (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{
                                background: "var(--surface)",
                                color: "var(--text-muted)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              Khách lẻ
                            </span>
                          ) : (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{
                                background: "rgba(234, 179, 8, 0.1)",
                                color: "#eab308",
                                border: "1px solid rgba(234, 179, 8, 0.2)",
                              }}
                            >
                              Thành viên
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.contactPhone}
                        </p>
                      </div>
                    </div>

                    {/* Info Rows */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: "var(--text-muted)" }}>
                          {t("admin.reservations.table_headers.guests")}
                        </span>
                        <span
                          className="font-bold flex items-center gap-1"
                          style={{ color: "var(--text)" }}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {item.numberOfGuests}
                        </span>
                      </div>
                      <div className="flex justify-between items-start text-sm">
                        <span style={{ color: "var(--text-muted)" }}>
                          {t("admin.reservations.table_headers.table_floor")}
                        </span>
                        <div className="flex flex-wrap justify-end gap-1.5 max-w-[180px]">
                          {item.tables.map((t, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[11px] font-medium"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                              }}
                            >
                              {t.code}{" "}
                              <span style={{ color: "var(--text-muted)" }}>
                                · {t.floorName}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <ReservationRowActions
                      item={item}
                      onActionComplete={fetchData}
                      onViewDetail={() => setSelectedId(item.id)}
                      restrictToToday
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Pagination ── */}
          {data && data.totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t("admin.reservations.pagination.page_info", {
                  page: data.pageNumber,
                  total: data.totalPages,
                  count: data.totalCount,
                })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.hasPreviousPage}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  {t("admin.reservations.pagination.prev")}
                </button>
                {Array.from(
                  { length: Math.min(5, data.totalPages) },
                  (_, i) => {
                    const p =
                      Math.max(
                        1,
                        Math.min(data.totalPages - 4, data.pageNumber - 2),
                      ) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                        style={
                          p === data.pageNumber
                            ? { background: "var(--primary)", color: "white" }
                            : {
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                            }
                        }
                      >
                        {p}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.hasNextPage}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  {t("admin.reservations.pagination.next")}
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
