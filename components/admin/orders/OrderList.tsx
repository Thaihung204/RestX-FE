"use client";

import OrderDetailsModal from "@/components/admin/orders/OrderDetailsModal";
import { usePageLoading } from "@/components/PageTransitionLoader";
import customerService from "@/lib/services/customerService";
import employeeService from "@/lib/services/employeeService";
import menuService from "@/lib/services/menuService";
import orderService, { OrderDto } from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import reservationService from "@/lib/services/reservationService";
import { tableService, type TableItem } from "@/lib/services/tableService";
import { TenantConfig, tenantService } from "@/lib/services/tenantService";
import { type OrderDetailModalItem } from "@/lib/types/order";
import { HubConnectionState } from "@microsoft/signalr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type OrderStatusUi =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string | null;
  tableCode: string;
  tableId: string;
  reservationId?: string | null;
  handledBy?: string | null;
  items: number;
  totalQuantity: number;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  status: OrderStatusUi;
  time: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  paymentStatus: "unpaid" | "paid";
  paymentStatusName?: string | null;
  raw: OrderDto;
}

export default function OrderList() {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  usePageLoading(loading);
  const [tablesById, setTablesById] = useState<Record<string, TableItem>>({});
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<
    OrderDetailModalItem[] | null
  >(null);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [dishNamesById, setDishNamesById] = useState<Record<string, string>>({});
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

  const loadTables = useCallback(async () => {
    try {
      const tables = await tableService.getAllTables();
      const dict: Record<string, TableItem> = {};
      tables.forEach((tb) => {
        dict[tb.id] = tb;
      });
      setTablesById(dict);
      return dict;
    } catch (error) {
      console.error("Failed to load tables for orders page:", error);
      return {} as Record<string, TableItem>;
    }
  }, []);

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

  const loadOrders = useCallback(
    async (tablesDict?: Record<string, TableItem>, showLoading = true) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        if (showLoading) setLoading(true);
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

        const employeesById: Record<string, string> = {};
        try {
          const employeesResp = await employeeService.getEmployees({
            page: 1,
            itemsPerPage: 500,
          });
          const employeeItems =
            employeesResp.data?.items ||
            employeesResp.data?.employees ||
            employeesResp.data?.data ||
            employeesResp.employees ||
            [];
          employeeItems.forEach((employee) => {
            employeesById[employee.id] = employee.fullName;
          });
        } catch (error) {
          console.error("Failed to load employees for handledBy mapping:", error);
        }

        const reservationCodeById: Record<string, string> = {};
        try {
          const reservationsResp = await reservationService.getReservations({
            pageNumber: 1,
            pageSize: 500,
          });
          (reservationsResp.items || []).forEach((reservation) => {
            reservationCodeById[reservation.id] = reservation.confirmationCode;
          });
        } catch (error) {
          console.error(
            "Failed to load reservations for reservationId mapping:",
            error,
          );
        }

        setOrders(
          data.map((o) => {
            const table = (tablesDict ?? tablesById)[o.tableId];
            const tableCode = table?.code || t("dashboard.orders.fallbacks.unknown_table", { defaultValue: "Unknown table" });
            const distinctCount = o.orderDetails?.length ?? 0;
            const totalQuantity =
              o.orderDetails?.reduce((sum, d) => sum + (d.quantity ?? 0), 0) ?? 0;
            const status = mapOrderStatus(o.orderStatusId);
            const paymentStatus = mapPaymentStatus(
              o.paymentStatusId ?? o.paymentStatus ?? 0,
            );
            const customer = customersById[o.customerId];

            return {
              id: o.id ?? "",
              orderNumber:
                o.reference && o.reference.trim().length > 0
                  ? o.reference
                  : `#${(o.id ?? "").slice(0, 8)}`,
              customerId: o.customerId,
              customerName:
                customer?.name ?? t("dashboard.orders.fallbacks.guest_name"),
              customerAvatar: customer?.avatar ?? null,
              tableCode,
              tableId: o.tableId,
              reservationId: o.reservationId
                ? reservationCodeById[o.reservationId] || o.reservationId
                : null,
              handledBy: o.handledBy
                ? employeesById[o.handledBy] || o.handledBy
                : null,
              items: distinctCount,
              totalQuantity,
              subTotal: Number(o.subTotal ?? 0),
              discountAmount: Number(o.discountAmount ?? 0),
              taxAmount: Number(o.taxAmount ?? 0),
              serviceCharge: Number(o.serviceCharge ?? 0),
              total: Number(o.totalAmount ?? 0),
              status,
              time: "",
              completedAt: o.completedAt ?? null,
              cancelledAt: o.cancelledAt ?? null,
              paymentStatus,
              paymentStatusName: o.paymentStatusName ?? null,
              raw: o,
            };
          }),
        );
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        if (showLoading) setLoading(false);
        inFlightRef.current = false;
      }
    },
    [tablesById, t],
  );

  const refreshOrders = useCallback(
    async (showLoading = true) => {
      const now = Date.now();
      if (lastRefreshRef.current && now - lastRefreshRef.current < 2000) return;
      lastRefreshRef.current = now;
      const tablesDict = await loadTables();
      await loadOrders(tablesDict, showLoading);
    },
    [loadTables, loadOrders],
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
    preparing: {
      text: t("dashboard.orders.status.preparing"),
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    ready: {
      text: t("dashboard.orders.status.ready"),
      badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
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

  const paymentStatusText = useMemo(
    () => ({
      paid: t("dashboard.orders.payment_status.paid"),
      unpaid: t("dashboard.orders.payment_status.unpaid"),
    }),
    [t],
  );

  const openOrderDetails = useCallback(
    async (order: OrderRow) => {
      setSelectedOrder(order);
      const details = order.raw.orderDetails ?? [];

      const missingDishIds = Array.from(
        new Set(
          details
            .filter(
              (d) =>
                !!d.dishId &&
                !dishNamesById[d.dishId] &&
                !(d as unknown as { dishName?: string | null }).dishName,
            )
            .map((d) => d.dishId),
        ),
      );

      const nextDishNames = { ...dishNamesById };
      if (missingDishIds.length > 0) {
        const fetched = await Promise.all(
          missingDishIds.map(async (dishId) => {
            try {
              const dish = await menuService.getDishById(dishId);
              return [dishId, dish.name] as const;
            } catch {
              return [dishId, ""] as const;
            }
          }),
        );

        fetched.forEach(([dishId, name]) => {
          nextDishNames[dishId] = name;
        });
        setDishNamesById(nextDishNames);
      }

      const mapped: OrderDetailModalItem[] = details.map((d) => {
        const listDishName = (d as unknown as { dishName?: string | null }).dishName;
        return {
          id: d.id ?? d.dishId,
          name: listDishName ?? nextDishNames[d.dishId] ?? undefined,
          quantity: d.quantity,
          note: d.note ?? null,
          status: d.status ?? null,
        };
      });

      setSelectedOrderDetails(mapped);
      setDetailOpen(true);
    },
    [dishNamesById],
  );

  return (
    <>
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
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.order")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.customer")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.table")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.items")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.total")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.status")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.payment")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.time")}
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.actions", { defaultValue: "Actions" })}
                </th>
              </tr>
            </thead>
            <tbody style={{ borderColor: "var(--border)" }}>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-[var(--surface)]"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {order.customerAvatar ? (
                        <img
                          src={order.customerAvatar}
                          alt={order.customerName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: "var(--primary)" }}>
                          {order.customerName?.charAt(0) ?? "G"}
                        </div>
                      )}
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {order.customerName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.orders.labels.table_code", {
                        tableCode: order.tableCode,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.orders.labels.items_count", {
                        count: order.items,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-500 font-bold">
                      {t("dashboard.orders.labels.total_quantity", {
                        count: order.totalQuantity,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        statusConfig[order.status].badge
                      }`}>
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
                      {order.paymentStatusName && order.paymentStatusName.trim()
                        ? order.paymentStatusName
                        : paymentStatusText[order.paymentStatus]}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: "var(--text-muted)" }}>
                    {order.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => openOrderDetails(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid var(--primary-border)" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {t("dashboard.orders.actions.view_detail", { defaultValue: "View detail" })}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrderDetailsModal
        open={detailOpen && !!selectedOrder}
        order={selectedOrder}
        orderNumber={selectedOrder?.orderNumber ?? ""}
        tableCode={selectedOrder?.tableCode ?? ""}
        total={selectedOrder?.total ?? 0}
        items={selectedOrderDetails ?? []}
        paymentStatusText={paymentStatusText}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
