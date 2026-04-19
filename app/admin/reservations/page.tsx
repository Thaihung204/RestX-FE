"use client";

import { DropDown } from "@/components/ui/DropDown";
import reservationService, {
    PaginatedReservations,
    ReservationDetail,
    ReservationListItem,
    ReservationStatus,
} from "@/lib/services/reservationService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { formatVND } from "@/lib/utils/currency";
import { triggerBrowserDownload } from "@/lib/utils/fileDownload";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { Select, message } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
      }}>
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
      .catch((error) => {
        console.error(error);
        message.error(
          extractApiErrorMessage(
            error,
            t("admin.reservations.messages.statuses_load_failed", {
              defaultValue: "Khong the tai trang thai dat ban",
            }),
          ),
        );
      });
  }, []);

  useEffect(() => {
    reservationService
      .getReservationById(reservationId)
      .then((d) => {
        setDetail(d);
        setSelectedStatusId(d.status.id);
      })
      .catch((error) => {
        console.error(error);
        setDetail(null);
        message.error(
          extractApiErrorMessage(
            error,
            t("admin.reservations.modal.load_error"),
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [reservationId]);

  const handleStatusChange = async (newStatusId: number) => {
    if (!detail || newStatusId === detail.status.id) return;
    setSelectedStatusId(newStatusId);
    setActionLoading(true);
    try {
      await reservationService.updateReservationStatus(
        reservationId,
        newStatusId,
      );
      onStatusUpdated();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(
        extractApiErrorMessage(
          e,
          t("admin.reservations.messages.update_status_failed", {
            defaultValue: "Khong the cap nhat trang thai dat ban",
          }),
        ),
      );
      setSelectedStatusId(detail.status.id);
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
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {t("admin.reservations.modal.title")}
            </h2>
            {detail && (
              <span
                className="text-sm font-mono"
                style={{ color: "var(--primary)" }}>
                #{detail.confirmationCode}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: "var(--surface)",
              color: "var(--text-muted)",
            }}>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
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
                style={{ background: "var(--surface)" }}>
                <span
                  className="text-sm font-medium shrink-0"
                  style={{ color: "var(--text-muted)" }}>
                  {t("admin.reservations.modal.status_label")}
                </span>
                <Select
                  value={selectedStatusId !== "" ? selectedStatusId : undefined}
                  disabled={actionLoading || allStatuses.length === 0}
                  loading={actionLoading}
                  onChange={(val: number) => handleStatusChange(val)}
                  style={{ minWidth: 180 }}
                  optionLabelProp="label"
                  options={allStatuses.filter((s) => s.code !== "CHECKED_IN").map((s) => {
                    const color =
                      s.code === "CONFIRMED" ? "#3b82f6" : s.colorCode;
                    const label = t(
                      `admin.reservations.status.${s.code.toLowerCase()}`,
                      { defaultValue: s.name },
                    );
                    return {
                      value: s.id,
                      label: (
                        <span style={{ color, fontWeight: 600, fontSize: 13 }}>
                          {label}
                        </span>
                      ),
                      rawLabel: label,
                      color,
                    };
                  })}
                  optionRender={(opt: any) => (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: (opt.data as any).color }}
                      />
                      <span
                        style={{
                          color: (opt.data as any).color,
                          fontWeight: 600,
                        }}>
                        {(opt.data as any).rawLabel}
                      </span>
                    </div>
                  )}
                />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact */}
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: "var(--surface)" }}>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}>
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
                  style={{ background: "var(--surface)" }}>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}>
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
                      .map((tb) => `${tb.code} (${tb.floorName})`)
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
                  style={{ background: "var(--surface)" }}>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--text-muted)" }}>
                    {t("admin.reservations.modal.special_requests")}
                  </p>
                  <p
                    className="text-sm italic"
                    style={{ color: "var(--text)" }}>
                    &ldquo;{detail.specialRequests}&rdquo;
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div
                className="flex flex-wrap gap-4 text-xs"
                style={{ color: "var(--text-muted)" }}>
                <span>
                  {t("admin.reservations.modal.created_at")}{" "}
                  {new Date(detail.createdAt).toLocaleString()}
                </span>
                {detail.checkedInAt &&
                  ["CHECKED_IN", "COMPLETED"].includes(detail.status.code) && (
                    <span style={{ color: "#8b5cf6" }}>
                      ✓ Checked in:{" "}
                      {new Date(detail.checkedInAt).toLocaleString()}
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
        style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReservationsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedReservations | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [statuses, setStatuses] = useState<ReservationStatus[]>([]);

  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          t("admin.reservations.messages.load_failed", {
            defaultValue: "Khong the tai danh sach dat ban",
          }),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [date, page, pageSize, search, statusId]);

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
            t("admin.reservations.messages.statuses_load_failed", {
              defaultValue: "Khong the tai trang thai dat ban",
            }),
          ),
        );
      });
  }, []);

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

  const pendingCount =
    data?.items.filter((i) => i.status.code === "PENDING").length ?? 0;
  const confirmedCount =
    data?.items.filter((i) => i.status.code === "CONFIRMED").length ?? 0;
  const completedCount =
    data?.items.filter((i) => i.status.code === "COMPLETED").length ?? 0;
  const totalCount = data?.totalCount ?? 0;

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2
              className="text-3xl font-bold mb-1"
              style={{ color: "var(--text)" }}>
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
              onClick={handleExportReservations}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: "var(--primary-soft)",
                border: "1px solid var(--primary-border)",
                color: "var(--primary)",
              }}>
              <DownloadOutlined />
              {exporting
                ? t("common.actions.exporting_report")
                : t("dashboard.actions.export_report")}
            </button>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}>
              <ReloadOutlined />
              {t("admin.reservations.refresh")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              labelKey: "total",
              value: totalCount,
              color: "var(--primary)",
              bg: "var(--primary-soft)",
            },
            {
              labelKey: "pending",
              value: pendingCount,
              color: "#FFA500",
              bg: "rgba(255,165,0,0.1)",
            },
            {
              labelKey: "confirmed",
              value: confirmedCount,
              color: "#3b82f6",
              bg: "rgba(59,130,246,0.1)",
            },
            {
              labelKey: "completed",
              value: completedCount,
              color: "#22c55e",
              bg: "rgba(34,197,94,0.1)",
            },
          ].map((stat) => (
            <div
              key={stat.labelKey}
              className="rounded-xl p-4 flex items-center justify-between"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t(`admin.reservations.stats.${stat.labelKey}`)}
                </p>
                <p
                  className="text-2xl font-bold mt-1"
                  style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-4 flex flex-wrap gap-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          <input
            type="text"
            placeholder={t("admin.reservations.filter.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />

          <DropDown
            value={statusId}
            onChange={(e) =>
              setStatusId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="px-3 py-2 text-sm min-w-[160px]">
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
              }}>
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
          }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "var(--surface)" }}>
                <tr>
                  {tableHeaderKeys.map((key) => (
                    <th
                      key={key}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                        ["table_floor", "guests", "status", "actions"].includes(
                          key,
                        )
                          ? "text-center"
                          : "text-left"
                      }`}
                      style={{ color: "var(--text-muted)" }}>
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
                      style={{ color: "var(--text-muted)" }}>
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-12 h-12 opacity-30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
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
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--primary)" }}>
                          #{item.confirmationCode}
                        </span>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "var(--primary)" }}>
                            {item.contactName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p
                                className="text-sm font-medium"
                                style={{ color: "var(--text)" }}>
                                {item.contactName}
                              </p>
                              {item.isGuest ? (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    background: "var(--surface)",
                                    color: "var(--text-muted)",
                                    border: "1px solid var(--border)",
                                  }}>
                                  {t("admin.reservations.modal.contact.guest")}
                                </span>
                              ) : (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    background: "rgba(234, 179, 8, 0.1)",
                                    color: "#eab308",
                                    border: "1px solid rgba(234, 179, 8, 0.2)",
                                  }}>
                                  {t("admin.reservations.modal.contact.member")}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}>
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
                              }}>
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
                          style={{ color: "var(--text)" }}>
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
                          style={{ color: "var(--text-muted)" }}>
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
                          }}>
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
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
                          <StatusBadge {...item.status} />
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setSelectedId(item.id)}
                            className="p-2 rounded-lg transition-all"
                            style={{
                              background: "var(--primary-soft)",
                              color: "var(--primary)",
                            }}
                            title={t("admin.reservations.actions.view_detail")}>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <Link
                            href={`/admin/reservation/${item.id}`}
                            className="p-2 rounded-lg transition-all"
                            style={{
                              background: "var(--surface)",
                              color: "var(--text-muted)",
                              border: "1px solid var(--border)",
                            }}
                            title={t("admin.reservations.actions.view_detail")}>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {data && data.totalCount > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.reservations.pagination.page_info_compact", {
                    page: data.pageNumber,
                    total: data.totalPages,
                    defaultValue: `Trang ${data.pageNumber}/${data.totalPages} ·`,
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
                    })}>
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
                    }}>
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
                          }>
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
                    }}>
                    {t("admin.reservations.pagination.next")}
                  </button>
                </div>
              )}
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
