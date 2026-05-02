"use client";

import { DropDown } from "@/components/ui/DropDown";
import reservationService, {
  PaginatedReservations,
  ReservationListItem,
  ReservationStatus,
} from "@/lib/services/reservationService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { triggerBrowserDownload } from "@/lib/utils/fileDownload";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { DayPicker } from "@/components/ui/DayPicker";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import AdminReservationCreateModal from "./components/AdminReservationCreateModal";
import { ReservationRowActions } from "../../../components/admin/reservations/ReservationRowActions";
import { tenantService } from "@/lib/services/tenantService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import { HubConnectionState } from "@microsoft/signalr";

const tableHeaderKeys = [
  "reservation_code",
  "customer",
  "table_floor",
  "date_time",
  "guests",
  "status",
  "actions",
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const STATUS_FLOW_ORDER: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  CHECKED_IN: 2,
  COMPLETED: 3,
  CANCELLED: 99,
  NO_SHOW: 99,
  NOSHOW: 99,
};

export default function ReservationsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedReservations | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [statuses, setStatuses] = useState<ReservationStatus[]>([]);

  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [statusId, setStatusId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [tenantId, setTenantId] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reservationService.getReservations({
        pageNumber: page,
        pageSize,
        search: search || undefined,
        statusId: statusId !== "" ? statusId : undefined,
        date: date || undefined,
        sortBy: "reservationDateTime",
        sortDescending: false,
      });
      setData(result);
    } catch (e) {
      console.error(e);
      message.error(
        extractApiErrorMessage(
          e,
          t("admin.reservations.messages.load_failed"),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [date, page, pageSize, search, statusId, t]);

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

  const [globalStats, setGlobalStats] = useState<{
    total: number;
    byStatus: Record<number, number>;
  }>({ total: 0, byStatus: {} });

  const fetchStats = useCallback(async () => {
    if (statuses.length === 0) return;
    try {
      const baseParams: any = { pageSize: 1 };
      if (search) baseParams.search = search;
      if (date) baseParams.date = date;

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
  }, [date, search, statuses]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [date, pageSize, search, statusId]);

  useEffect(() => {
    reservationService
      .getReservationStatuses()
      .then(setStatuses)
      .catch((error) => {
        console.error(error);
        message.error(
          extractApiErrorMessage(
            error,
            t("admin.reservations.messages.statuses_load_failed"),
          ),
        );
      });
  }, [t]);

  useEffect(() => {
    tenantService
      .getTenantConfig(window.location.hostname)
      .then((tenant) => {
        if (tenant?.id) setTenantId(tenant.id);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const handleReservationChanged = (payload: any) => {
      if (!isMounted) return;
      const changedTenantId =
        payload?.tenantId || payload?.reservation?.tenantId;
      if (changedTenantId && changedTenantId !== tenantId) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isMounted) return;
        fetchData();
        fetchStats();
      }, 300);
    };

    const events = [
      "reservations.created",
      "reservations.updated",
      "reservations.cancelled",
      "reservations.status_updated",
    ];

    const setupSignalR = async () => {
      try {
        await orderSignalRService.start();
        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke("JoinTenantGroup", tenantId);
          events.forEach((event) =>
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
      if (debounceTimer) clearTimeout(debounceTimer);
      events.forEach((event) =>
        orderSignalRService.off(event, handleReservationChanged),
      );
      orderSignalRService.invoke("LeaveTenantGroup", tenantId).catch(() => { });
    };
  }, [tenantId, fetchData, fetchStats]);

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

  const handleExportReservations = useCallback(async () => {
    setExporting(true);
    try {
      const file = await reservationService.exportReservations({
        search: search || undefined,
        statusId: statusId !== "" ? statusId : undefined,
        date: date || undefined,
        sortBy: "reservationDateTime",
        sortDescending: false,
      });

      triggerBrowserDownload(file.blob, file.fileName);
      message.success(t("common.messages.export_success"));
    } catch (error) {
      console.error("Failed to export reservations:", error);
      message.error(
        extractApiErrorMessage(error, t("common.messages.export_failed")),
      );
    } finally {
      setExporting(false);
    }
  }, [date, search, statusId, t]);



  const totalCount = data?.totalCount ?? 0;

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "var(--primary)",
                border: "1px solid var(--primary-border)",
                color: "#fff",
              }}
            >
              <PlusOutlined />
              Thêm Đặt Bàn
            </button>
            <button
              onClick={handleExportReservations}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: "var(--primary-soft)",
                border: "1px solid var(--primary-border)",
                color: "var(--primary)",
              }}
            >
              <DownloadOutlined />
              {exporting
                ? t("common.actions.exporting_report")
                : t("dashboard.actions.export_report")}
            </button>

          </div>
        </div>

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

        <div
          className="rounded-xl p-4 flex flex-wrap gap-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <input
            type="text"
            placeholder={t("admin.reservations.filter.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-[14px] py-[10px] rounded-xl text-[14px] outline-none transition-colors"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />

          <DropDown
            value={statusId}
            onChange={(e) =>
              setStatusId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="!px-[14px] !py-[10px] !text-[14px] !rounded-xl min-w-[160px]"
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
          </DropDown>

          <div className="flex-1 min-w-[200px]">
            <DayPicker
              value={date ? dayjs(date) : null}
              onChange={(d) => setDate(d.format("YYYY-MM-DD"))}
              placeholder={t("admin.reservations.filter.date_placeholder", { defaultValue: "Chọn ngày" })}
            />
          </div>

          {(search || statusId !== "" || date) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusId("");
                setDate("");
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

        {/* Table */}
        <div
          className="rounded-xl overflow-visible"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
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
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                            style={{ background: "var(--primary)" }}
                          >
                            {item.customer?.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.customer.avatarUrl}
                                alt={item.contactName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              item.contactName.charAt(0).toUpperCase()
                            )}
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
                          {item.tables.map((tb, i: number) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded flex items-center gap-1 text-[11px] font-medium"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                              }}
                            >
                              {tb.code}{" "}
                              <span style={{ color: "var(--text-muted)" }}>
                                · {tb.floorName}
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
                              className="px-2 py-1 rounded-full text-xs font-medium border cursor-pointer outline-none transition-colors"
                              style={{
                                backgroundColor: badgeBackground,
                                borderColor: badgeBorder,
                                color: currentColor,
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
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <ReservationRowActions item={item} onActionComplete={fetchData} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Pagination Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {data && data.totalCount > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.reservations.pagination.page_info_compact", {
                    page: data.pageNumber,
                    total: data.totalPages,
                    defaultValue: `Trang ${data.pageNumber} / ${data.totalPages} ·`,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <DropDown
                    value={String(pageSize)}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    containerClassName="w-[110px]"
                    className="!h-9 !py-1.5 !pl-3 !pr-8 !text-sm"
                    aria-label={t("common.pagination.items_per_page", {
                      defaultValue: "Items/page",
                    })}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </DropDown>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("admin.reservations.pagination.results_label", {
                      defaultValue: "kết quả",
                    })}
                  </p>
                </div>
              </div>

              {data.totalPages > 1 && (
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
              )}
            </div>
          )}
        </div>
      </div>

      <AdminReservationCreateModal
        open={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => fetchData()}
      />


    </main>
  );
}
