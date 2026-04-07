"use client";

import customerService from "@/lib/services/customerService";
import orderService, { OrderDto } from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import { TenantConfig, tenantService } from "@/lib/services/tenantService";
import { HubConnectionState } from "@microsoft/signalr";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type OrderStatusUi =
  | "pending"
  | "served"
  | "completed"
  | "cancelled";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerAvatar?: string | null;
  items: number;
  totalQuantity: number;
  total: number;
  status: OrderStatusUi;
  time: string;
  paymentStatus: "unpaid" | "paid";
  raw: OrderDto;
}

export default function OrdersPage() {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const inFlightRef = useRef(false);
  const lastRefreshRef = useRef<number | null>(null);

  const mapOrderStatus = (statusId: number): OrderStatusUi => {
    switch (statusId) {
      case 0:
        return "pending";
      case 1:
        return "served";
      case 2:
        return "completed";
      case 3:
        return "cancelled";
      default:
        return "pending";
    }
  };

  const mapPaymentStatus = (statusId: number): "unpaid" | "paid" => {
    return statusId === 1 ? "paid" : "unpaid";
  };

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
        const data = await orderService.getAllOrders();
        const uniqueCustomerIds = Array.from(
          new Set(data.map((o) => o.customerId).filter(Boolean)),
        );

        const customersById: Record<string, { name: string; avatar?: string }> =
          {};
        await Promise.all(
          uniqueCustomerIds.map(async (cid) => {
            try {
              const c = await customerService.getCustomerById(cid);
              if (c) customersById[c.id] = { name: c.name, avatar: c.avatar };
            } catch (err) {
              console.error("Failed to load customer", cid, err);
            }
          }),
        );

        setOrders(
          data.map((o) => {
            const distinctCount = o.orderDetails?.length ?? 0;
            const totalQuantity =
              o.orderDetails?.reduce((sum, d) => sum + (d.quantity ?? 0), 0) ??
              0;
            const status = mapOrderStatus(o.orderStatusId);
            const paymentStatus = mapPaymentStatus(o.paymentStatusId);
            const customer = customersById[o.customerId];

            return {
              id: o.id ?? "",
              orderNumber:
                o.reference && o.reference.trim().length > 0
                  ? o.reference
                  : `#${(o.id ?? "").slice(0, 8)}`,
              customerName:
                customer?.name ?? t("dashboard.orders.fallbacks.guest_name"),
              customerAvatar: customer?.avatar ?? null,
              items: distinctCount,
              totalQuantity,
              total: Number(o.totalAmount ?? 0),
              status,
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
      } finally {
        inFlightRef.current = false;
      }
    },
    [t],
  );

  const refreshOrders = useCallback(
    async (showLoading = true) => {
      const now = Date.now();
      if (lastRefreshRef.current && now - lastRefreshRef.current < 2000) return;
      lastRefreshRef.current = now;

      if (showLoading) setLoading(true);
      try {
        await loadOrders();
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [loadOrders],
  );

  useEffect(() => {
    refreshOrders().catch(console.error);
  }, [refreshOrders]);

  useEffect(() => {
    if (!tenant?.id) return;

    let isMounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOrderChange = (payload: any) => {
      if (!isMounted) return;
      const changedTenantId = payload?.tenantId || payload?.order?.tenantId;
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
          events.forEach((event) =>
            orderSignalRService.on(event, handleOrderChange),
          );
        }
      } catch (error) {
        console.error("SignalR: Setup failed", error);
      }
    };

    setupSignalR();

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      events.forEach((event) =>
        orderSignalRService.off(event, handleOrderChange),
      );
      orderSignalRService.invoke("LeaveTenantGroup", tenant.id).catch(() => {});
    };
  }, [refreshOrders, tenant?.id]);

  const statusConfig = {
    pending: {
      text: t("dashboard.orders.status.pending"),
      badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    served: {
      text: t("dashboard.orders.status.served"),
      badge: "text-[var(--primary)] border-[var(--primary-border)]",
    },
    completed: {
      text: t("dashboard.orders.status.completed"),
      badge: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    cancelled: {
      text: t("dashboard.orders.status.cancelled"),
      badge: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
              {t("dashboard.orders.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.orders.subtitle")}
            </p>
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {t("dashboard.orders.title")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "var(--surface)" }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("dashboard.orders.table.order")}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("dashboard.orders.table.customer")}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("dashboard.orders.table.items")}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("dashboard.orders.table.total")}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("dashboard.orders.table.status")}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("dashboard.orders.table.payment")}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("dashboard.orders.table.time")}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("dashboard.orders.table.actions")}</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: "var(--border)" }}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-6">
                      <div className="w-full rounded-xl animate-pulse" style={{ background: "var(--surface)", height: 360 }} />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.orders.empty")}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span style={{ color: "var(--primary)", fontWeight: 600 }}>{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {order.customerAvatar ? (
                            <img src={order.customerAvatar} alt={order.customerName} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--primary)" }}>
                              {order.customerName?.charAt(0) ?? "G"}
                            </div>
                          )}
                          <span className="font-medium" style={{ color: "var(--text)" }}>{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span style={{ color: "var(--text-muted)" }}>
                          {t("dashboard.orders.labels.items_count", { count: order.items })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-green-500 font-bold">
                          {t("dashboard.orders.labels.total_quantity", { count: order.totalQuantity })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[order.status].badge}`}>
                          {statusConfig[order.status].text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: "var(--text-muted)" }}>
                        {order.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 rounded-lg transition-all"
                            style={{
                              backgroundColor: "var(--primary-soft)",
                              color: "var(--primary)",
                            }}
                            title={t("dashboard.orders.actions.view_details")}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
        </div>
      </div>
    </main>
  );
}
