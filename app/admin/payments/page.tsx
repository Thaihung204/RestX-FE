"use client";

import { DropDown } from "@/components/ui/DropDown";
import paymentService, { PaymentDetail } from "@/lib/services/paymentService";
import { formatVND } from "@/lib/utils/currency";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { ExportOutlined, ReloadOutlined } from "@ant-design/icons";
import { message } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DayPicker } from "@/components/ui/DayPicker";
import dayjs from "dayjs";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "#f97316" },
  1: { label: "Success", color: "#22c55e" },
  2: { label: "Failed", color: "#ef4444" },
};

export default function PaymentsPage() {
  const { t } = useTranslation("common");
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState("");

  const inFlightRef = useRef(false);
  const lastRefreshRef = useRef<number | null>(null);

  const loadPayments = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const data = await paymentService.getAllPayments({
        from: dateFilter ? `${dateFilter}T00:00:00Z` : undefined,
        to: dateFilter ? `${dateFilter}T23:59:59Z` : undefined,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
      });
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load payments:", error);
      throw error;
    } finally {
      inFlightRef.current = false;
    }
  }, [dateFilter, statusFilter, methodFilter]);

  const refreshPayments = useCallback(
    async (showLoading = true) => {
      const now = Date.now();
      if (lastRefreshRef.current && now - lastRefreshRef.current < 2000) return;
      lastRefreshRef.current = now;
      if (showLoading) setLoading(true);
      try {
        await loadPayments();
      } catch (error) {
        if (showLoading) {
          message.error(extractApiErrorMessage(error, tRef.current("payments.fetch_error")));
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [loadPayments],
  );

  // Only fetch on mount (once) and when filters change — NOT when language changes
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      refreshPayments().catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filters change (not on mount since above handles it)
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) { isFirstFilterRun.current = false; return; }
    refreshPayments().catch(console.error);
  }, [dateFilter, statusFilter, methodFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(1);
  }, [statusFilter, methodFilter, dateFilter, searchTerm, pageSize]);

  const filteredPayments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
      [p.customerName, p.id, p.orderId, p.paymentMethodId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [payments, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [currentPage, filteredPayments, pageSize]);

  const hasActiveFilter =
    statusFilter || methodFilter || dateFilter || searchTerm.trim();

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2
              className="text-3xl font-bold mb-1"
              style={{ color: "var(--text)" }}>
              {t("payments.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("payments.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshPayments()}
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

        {/* Filters */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label
                className="block text-xs"
                style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.search.label")}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("payments.search_placeholder")}
                className="w-full px-[14px] py-[10px] rounded-xl text-[14px] outline-none transition-colors"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>

            <div className="space-y-1">
              <label
                className="block text-xs"
                style={{ color: "var(--text-muted)" }}>
                {t("payments.filter.status_label")}
              </label>
              <DropDown
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="!py-[10px] !px-[14px] !text-[14px] !rounded-xl">
                <option value="">{t("payments.filter.all_status")}</option>
                <option value="0">{t("payments.filter.pending")}</option>
                <option value="1">{t("payments.filter.success")}</option>
                <option value="2">{t("payments.filter.failed")}</option>
              </DropDown>
            </div>

            <div className="space-y-1">
              <label
                className="block text-xs"
                style={{ color: "var(--text-muted)" }}>
                {t("payments.filter.method_label")}
              </label>
              <DropDown
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="!py-[10px] !px-[14px] !text-[14px] !rounded-xl">
                <option value="">{t("payments.filter.all_methods")}</option>
                <option value="CASH">CASH</option>
                <option value="BANK">BANK</option>
              </DropDown>
            </div>

            <div className="space-y-1">
              <label
                className="block text-xs"
                style={{ color: "var(--text-muted)" }}>
                {t("payments.filter.date_label")}
              </label>
              <div>
                <DayPicker
                  value={dateFilter ? dayjs(dateFilter) : null}
                  onChange={(d) => setDateFilter(d ? d.format("YYYY-MM-DD") : "")}
                  placeholder={t("admin.reservations.filter.date_placeholder", {
                    defaultValue: "Chọn ngày",
                  })}
                />
              </div>
            </div>
          </div>

          {hasActiveFilter && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setMethodFilter("");
                  setDateFilter("");
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}>
                {t("admin.reservations.filter.clear")}
              </button>
            </div>
          )}
        </div>

        {/* Table */}
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
                  {[
                    t("payments.columns.customer"),
                    t("payments.columns.method"),
                    t("payments.columns.amount"),
                    t("payments.columns.purpose"),
                    t("payments.columns.status"),
                    t("payments.columns.date"),
                    t("payments.columns.checkout"),
                    // t("payments.columns.actions"),
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`px-6 py-4 text-xs font-medium uppercase tracking-wider ${i >= 2 ? "text-center" : "text-left"}`}
                      style={{ color: "var(--text-muted)" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-6">
                      <div
                        className="w-full rounded-xl animate-pulse"
                        style={{ background: "var(--surface)", height: 360 }}
                      />
                    </td>
                  </tr>
                ) : pagedPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("payments.empty")}
                    </td>
                  </tr>
                ) : (
                  pagedPayments.map((p) => {
                    const st = STATUS_MAP[p.status ?? -1];
                    return (
                      <tr
                        key={p.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="font-medium"
                            style={{ color: "var(--text)" }}>
                            {p.customerName || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="px-2 py-1 rounded text-xs font-mono font-semibold uppercase"
                            style={{
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text)",
                            }}>
                            {p.paymentMethodId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className="font-bold"
                            style={{ color: "var(--primary)" }}>
                            {formatVND(p.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span style={{ color: "var(--text-muted)" }}>
                            {p.purposeName || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: st
                                ? `${st.color}1A`
                                : "var(--surface)",
                              color: st?.color ?? "var(--text-muted)",
                              border: `1px solid ${st ? `${st.color}33` : "var(--border)"}`,
                            }}>
                            {p.statusName || "—"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-center text-sm"
                          style={{ color: "var(--text-muted)" }}>
                          {p.paymentDate
                            ? new Date(p.paymentDate).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                            : "—"}
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-center">
                          {p.checkoutUrl ? (
                            <button
                              onClick={() =>
                                window.open(
                                  p.checkoutUrl!,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mx-auto"
                              style={{
                                background: "var(--primary-soft)",
                                color: "var(--primary)",
                                border: "1px solid var(--primary-border)",
                              }}>
                              <ExportOutlined />
                              PayOS
                            </button>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {p.orderId || p.reservationId ? (
                            <Link
                              href={`/admin/payments/${p.id}`}
                              className="p-2 rounded-lg transition-all inline-flex"
                              style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}
                              title={t("payments.view_details")}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredPayments.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.reservations.pagination.page_info_compact", {
                    page: currentPage,
                    total: totalPages,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <DropDown
                    value={String(pageSize)}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    containerClassName="w-[110px]"
                    className="!h-9 !py-1.5 !pl-3 !pr-8 !text-sm"
                    aria-label={t("common.pagination.items_per_page")}>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </DropDown>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("admin.reservations.pagination.results_label")}
                  </p>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}>
                    {t("admin.reservations.pagination.prev")}
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg =
                      Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                      i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                        style={
                          pg === currentPage
                            ? { background: "var(--primary)", color: "white" }
                            : {
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                            }
                        }>
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
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
    </main>
  );
}
