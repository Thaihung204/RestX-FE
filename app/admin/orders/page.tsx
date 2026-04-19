"use client";

import { DropDown } from "@/components/ui/DropDown";
import orderService, { OrderDto } from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import orderStatusService, {
  OrderStatus,
} from "@/lib/services/orderStatusService";
import { TenantConfig, tenantService } from "@/lib/services/tenantService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { formatVND } from "@/lib/utils/currency";
import { triggerBrowserDownload } from "@/lib/utils/fileDownload";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { HubConnectionState } from "@microsoft/signalr";
import { message } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  items: number;
  totalQuantity: number;
  total: number;
  orderStatusId: number;
  time: string;
  paymentStatus: "unpaid" | "paid";
  raw: OrderDto;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function OrdersPage() {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState<boolean>(false);

  const inFlightRef = useRef(false);
  const lastRefreshRef = useRef<number | null>(null);

  const orderFilterParams = useMemo(
    () => ({
      Status: statusFilter === "" ? undefined : Number(statusFilter),
      From: fromDate ? `${fromDate}T00:00:00Z` : undefined,
      To: toDate ? `${toDate}T23:59:59Z` : undefined,
    }),
    [fromDate, statusFilter, toDate],
  );

  const mapPaymentStatus = (statusId: number): "unpaid" | "paid" => {
    return statusId === 1 ? "paid" : "unpaid";
  };

  useEffect(() => {
    orderStatusService
      .getAllStatuses()
      .then((data) => setOrderStatuses(data ?? []))
      .catch((error) => {
        console.error("Failed to load order statuses:", error);
        message.error(
          extractApiErrorMessage(
            error,
            t("admin.orders.messages.statuses_load_failed", {
              defaultValue: "Khong the tai trang thai don hang",
            }),
          ),
        );
      });
  }, [t]);

  useEffect(() => {
    let isMounted = true;

    const fetchTenant = async () => {
      try {
        const host = window.location.host;
        const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;

        if (hostWithoutPort === "admin.restx.food") return;

        if (
          hostWithoutPort === "admin.localhost" ||
          hostWithoutPort === "localhost" ||
          hostWithoutPort === "127.0.0.1"
        ) {
          const data = await tenantService.getTenantConfig("demo.restx.food");
          if (isMounted) setTenant(data || null);
          return;
        }

        if (hostWithoutPort.endsWith(".localhost")) {
          const subdomain = hostWithoutPort.replace(".localhost", "");
          const tenantHost =
            subdomain && subdomain !== "admin"
              ? `${subdomain}.restx.food`
              : "demo.restx.food";
          const data = await tenantService.getTenantConfig(tenantHost);
          if (isMounted) setTenant(data || null);
          return;
        }

        if (!hostWithoutPort.startsWith("admin.")) {
          const data = await tenantService.getTenantConfig(hostWithoutPort);
          if (isMounted) setTenant(data || null);
        }
      } catch (error) {
        console.error("Failed to resolve tenant for admin orders:", error);
      }
    };

    fetchTenant();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadOrders = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const data = await orderService.getAllOrders(orderFilterParams);

      setOrders(
        data.map((o) => {
          const distinctCount = o.orderDetails?.length ?? 0;
          const totalQuantity =
            o.orderDetails?.reduce((sum, d) => sum + (d.quantity ?? 0), 0) ?? 0;
          const orderStatusId = o.orderStatusId;
          const paymentStatus = mapPaymentStatus(
            o.paymentStatusId ?? o.paymentStatus ?? 0,
          );
          const customerNameFromOrder = o.customerName?.trim();

          return {
            id: o.id ?? "",
            orderNumber:
              o.reference && o.reference.trim().length > 0
                ? o.reference
                : `#${(o.id ?? "").slice(0, 8)}`,
            customerName: customerNameFromOrder || "Guest",
            items: distinctCount,
            totalQuantity,
            total: Number(o.totalAmount ?? 0),
            orderStatusId,
            time: o.createdDate
              ? new Date(o.createdDate).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "",
            paymentStatus,
            raw: o,
          };
        }),
      );
    } catch (error) {
      console.error("Failed to load orders:", error);
      throw error;
    } finally {
      inFlightRef.current = false;
    }
  }, [orderFilterParams]);

  const refreshOrders = useCallback(
    async (showLoading = true) => {
      const now = Date.now();
      if (lastRefreshRef.current && now - lastRefreshRef.current < 2000) return;
      lastRefreshRef.current = now;

      if (showLoading) setLoading(true);

      try {
        await loadOrders();
      } catch (error) {
        if (showLoading) {
          message.error(
            extractApiErrorMessage(
              error,
              t("admin.orders.messages.load_failed", {
                defaultValue: "Khong the tai danh sach don hang",
              }),
            ),
          );
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [loadOrders, t],
  );

  useEffect(() => {
    refreshOrders().catch(console.error);
  }, [refreshOrders]);

  useEffect(() => {
    if (!tenant?.id) return;

    let isMounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOrderChange = (payload: unknown) => {
      if (!isMounted) return;

      const payloadObj = payload as {
        tenantId?: string;
        order?: { tenantId?: string };
      };
      const changedTenantId = payloadObj?.tenantId || payloadObj?.order?.tenantId;
      if (changedTenantId && changedTenantId !== tenant.id) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isMounted) return;
        refreshOrders(false);
      }, 300);
    };

    const events = ["orders.created", "orders.updated", "orders.deleted"];

    const setupSignalR = async () => {
      try {
        await orderSignalRService.start();

        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke("JoinTenantGroup", tenant.id);
          events.forEach((event) => {
            orderSignalRService.on(event, handleOrderChange);
          });
        }
      } catch (error) {
        console.error("SignalR: Setup failed", error);
      }
    };

    setupSignalR();

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      events.forEach((event) => {
        orderSignalRService.off(event, handleOrderChange);
      });
      orderSignalRService.invoke("LeaveTenantGroup", tenant.id).catch(() => {});
    };
  }, [refreshOrders, tenant?.id]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, statusFilter, toDate, pageSize, searchTerm]);

  const handleExportOrders = useCallback(async () => {
    setExporting(true);
    try {
      const file = await orderService.exportOrders(orderFilterParams);
      triggerBrowserDownload(file.blob, file.fileName);
      message.success(t("common.messages.export_success"));
    } catch (error) {
      console.error("Failed to export orders:", error);
      message.error(
        extractApiErrorMessage(error, t("common.messages.export_failed")),
      );
    } finally {
      setExporting(false);
    }
  }, [orderFilterParams, t]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return orders;

    return orders.filter((order) => {
      const haystack = [
        order.orderNumber,
        order.customerName,
        order.id,
        order.raw?.reference ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [orders, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [currentPage, filteredOrders, pageSize]);

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2
              className="text-3xl font-bold mb-1"
              style={{ color: "var(--text)" }}>
              {t("dashboard.orders.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.orders.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportOrders}
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
              onClick={() => refreshOrders()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}>
              <ReloadOutlined />
              {t("admin.reservations.refresh", { defaultValue: "Lam moi" })}
            </button>
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="orders-filter-search"
                className="block text-xs"
                style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.search.label", {
                  defaultValue: "Tìm kiếm",
                })}
              </label>
              <input
                id="orders-filter-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 px-4 rounded-lg text-sm outline-none"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="orders-filter-status"
                className="block text-xs"
                style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.table.status", {
                  defaultValue: "Trang thai",
                })}
              </label>
              <select
                id="orders-filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-14 px-4 rounded-lg text-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}>
                <option value="">
                  {t("admin.reservations.filter.all_status", {
                    defaultValue: "Tat ca trang thai",
                  })}
                </option>
                {orderStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="orders-filter-from-date"
                className="block text-xs"
                style={{ color: "var(--text-muted)" }}>
                {t("admin.reservations.filter.from_date", {
                  defaultValue: "Tu ngay",
                })}
              </label>
              <input
                id="orders-filter-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-14 px-4 rounded-lg text-sm outline-none"
                aria-label={t("admin.reservations.filter.from_date", {
                  defaultValue: "Tu ngay",
                })}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="orders-filter-to-date"
                className="block text-xs"
                style={{ color: "var(--text-muted)" }}>
                {t("admin.reservations.filter.to_date", {
                  defaultValue: "Den ngay",
                })}
              </label>
              <input
                id="orders-filter-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-14 px-4 rounded-lg text-sm outline-none"
                aria-label={t("admin.reservations.filter.to_date", {
                  defaultValue: "Den ngay",
                })}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>
          </div>

          {(statusFilter !== "" || fromDate || toDate || searchTerm.trim()) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setFromDate("");
                  setToDate("");
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}>
                {t("admin.reservations.filter.clear", {
                  defaultValue: "Xoa loc",
                })}
              </button>
            </div>
          )}
        </div>

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
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.order")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.customer")}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.items")}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.total")}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.status")}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.payment")}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.time")}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderColor: "var(--border)" }}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-6">
                      <div
                        className="w-full rounded-xl animate-pulse"
                        style={{ background: "var(--surface)", height: 360 }}
                      />
                    </td>
                  </tr>
                ) : pagedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("orders.empty", { defaultValue: "No orders found" })}
                    </td>
                  </tr>
                ) : (
                  pagedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <span
                          style={{ color: "var(--primary)", fontWeight: 600 }}>
                          {order.orderNumber}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <span
                          className="font-medium"
                          style={{ color: "var(--text)" }}>
                          {order.customerName}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span style={{ color: "var(--text-muted)" }}>
                          {t("dashboard.orders.labels.items_count", {
                            count: order.items,
                          })}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-bold" style={{ color: "var(--text)" }}>
                          {formatVND(order.total)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(() => {
                          const st = orderStatuses.find(
                            (s) => s.id === String(order.orderStatusId),
                          );

                          return (
                            <select
                              className="px-2 py-1 rounded-full text-xs font-medium border cursor-pointer outline-none transition-colors"
                              style={{
                                backgroundColor: st
                                  ? `${st.color}1A`
                                  : "var(--surface)",
                                color: st ? st.color : "var(--text)",
                                borderColor: st
                                  ? `${st.color}33`
                                  : "var(--border)",
                              }}
                              value={
                                order.orderStatusId != null
                                  ? String(order.orderStatusId)
                                  : ""
                              }
                              onChange={async (e) => {
                                if (!e.target.value) return;
                                const nextStatusId = Number(e.target.value);

                                try {
                                  await orderService.updateOrderStatus(
                                    order.id,
                                    nextStatusId,
                                  );

                                  setOrders((prev) =>
                                    prev.map((item) =>
                                      item.id === order.id
                                        ? { ...item, orderStatusId: nextStatusId }
                                        : item,
                                    ),
                                  );

                                  message.success(
                                    t("admin.order_detail.messages.update_success", {
                                      defaultValue: "Cap nhat trang thai thanh cong",
                                    }),
                                  );
                                } catch (err) {
                                  console.error("Failed to update status", err);
                                  message.error(
                                    extractApiErrorMessage(
                                      err,
                                      t("admin.order_detail.messages.update_error", {
                                        defaultValue: "Cap nhat loi",
                                      }),
                                    ),
                                  );
                                }
                              }}>
                              {!st && (
                                <option value="" disabled>
                                  -
                                </option>
                              )}
                              {orderStatuses.map((status) => (
                                <option
                                  key={status.id}
                                  value={status.id}
                                  style={{
                                    color: "var(--text)",
                                    background: "var(--card)",
                                  }}>
                                  {status.name}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.paymentStatus === "paid"
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}>
                          {order.paymentStatus === "paid"
                            ? t("dashboard.orders.payment_status.paid")
                            : t("dashboard.orders.payment_status.unpaid")}
                        </span>
                      </td>

                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-center"
                        style={{ color: "var(--text-muted)" }}>
                        {order.time}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 rounded-lg transition-all"
                            style={{
                              backgroundColor: "var(--primary-soft)",
                              color: "var(--primary)",
                            }}
                            title={t("dashboard.orders.actions.view_details")}>
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
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredOrders.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.reservations.pagination.page_info_compact", {
                    page: currentPage,
                    total: totalPages,
                    defaultValue: `Trang ${currentPage}/${totalPages} Â·`,
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
                      defaultValue: "ket qua",
                    })}
                  </p>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}>
                    {t("admin.reservations.pagination.prev", {
                      defaultValue: "Truoc",
                    })}
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p =
                      Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                        style={
                          p === currentPage
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
                  })}

                  <button
                    onClick={() =>
                      setPage((p: number) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}>
                    {t("admin.reservations.pagination.next", {
                      defaultValue: "Sau",
                    })}
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
