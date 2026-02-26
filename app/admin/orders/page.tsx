"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import orderService, { OrderDto } from "@/lib/services/orderService";
import { tableService, type TableItem } from "@/lib/services/tableService";
import customerService from "@/lib/services/customerService";
import menuService from "@/lib/services/menuService";

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
  customerName: string;
  customerAvatar?: string | null;
  tableCode: string;
  items: number; // distinct dish count
  totalQuantity: number; // total quantity of all dishes
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
  const [tablesById, setTablesById] = useState<Record<string, TableItem>>({});
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<
    { id: string; name?: string; quantity: number }[] | null
  >(null);

  // Map backend enums to UI strings
  const mapOrderStatus = (statusId: number): OrderStatusUi => {
    switch (statusId) {
      case 0:
        return "pending"; // Reserved
      case 1:
        return "served"; // Serving
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

  const loadTables = async () => {
    try {
      const tables = await tableService.getAllTables();
      const dict: Record<string, TableItem> = {};
      tables.forEach((t) => {
        dict[t.id] = t;
      });
      setTablesById(dict);
    } catch (error) {
      console.error("Failed to load tables for orders page:", error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      // Pre-fetch unique customers referenced by orders to show name/avatar
      const uniqueCustomerIds = Array.from(
        new Set(data.map((o) => o.customerId).filter(Boolean)),
      );

      const customersById: Record<string, { name: string; avatar?: string }> = {};
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
          const table = tablesById[o.tableId];
          const tableCode = table?.code || o.tableId;
          const distinctCount = o.orderDetails?.length ?? 0;
          const totalQuantity =
            o.orderDetails?.reduce((sum, d) => sum + (d.quantity ?? 0), 0) ?? 0;
          const status = mapOrderStatus(o.orderStatusId);
          const paymentStatus = mapPaymentStatus(o.paymentStatusId);
          const customer = customersById[o.customerId];

          return {
            id: o.id ?? "",
            orderNumber:
              o.reference && o.reference.trim().length > 0
                ? o.reference
                : `#${(o.id ?? "").slice(0, 8)}`,
            customerName: customer?.name ?? "Guest",
            customerAvatar: customer?.avatar ?? null,
            tableCode,
            items: distinctCount,
            totalQuantity,
            total: Number(o.totalAmount ?? 0),
            status,
            time: "",
            paymentStatus,
            raw: o,
          };
        }),
      );
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load tables first, then orders so we can map table code
    loadTables().then(loadOrders).catch(console.error);
  }, []);

  const statusConfig = {
    pending: {
      color: "bg-yellow-500",
      text: t("dashboard.orders.status.pending"),
      badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    preparing: {
      color: "bg-blue-500",
      text: t("dashboard.orders.status.preparing"),
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    ready: {
      color: "bg-purple-500",
      text: t("dashboard.orders.status.ready"),
      badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    },
    served: {
      color: "bg-[var(--primary)]",
      text: t("dashboard.orders.status.served"),
      badge: "text-[var(--primary)] border-[var(--primary-border)]",
      bgStyle: { backgroundColor: "var(--primary-soft)" },
    },
    completed: {
      color: "bg-green-500",
      text: t("dashboard.orders.status.completed"),
      badge: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    cancelled: {
      color: "bg-red-500",
      text: t("dashboard.orders.status.cancelled"),
      badge: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  const stats = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      served: orders.filter((o) => o.status === "served").length,
      completed: orders.filter((o) => o.status === "completed").length,
    }),
    [orders],
  );

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--text)" }}>
              {t("dashboard.orders.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.orders.subtitle")}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(234, 179, 8, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.stats.pending")}
                </p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.stats.preparing")}
                </p>
                <p className="text-3xl font-bold text-blue-500 mt-1">
                  {stats.preparing}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.stats.ready")}
                </p>
                <p className="text-3xl font-bold text-purple-500 mt-1">
                  {stats.ready}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(255, 56, 11, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.stats.served")}
                </p>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ color: "var(--primary)" }}>
                  {stats.served}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--primary-soft)" }}>
                <svg
                  className="w-6 h-6"
                  style={{ color: "var(--primary)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.stats.completed")}
                </p>
                <p className="text-3xl font-bold text-green-500 mt-1">
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          <div
            className="p-6"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {t("dashboard.orders.title")}
            </h3>
          </div>
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
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.table")}
                  </th>
                  <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.orders.table.items")}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.orders.table.total")}
                    </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.status")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.payment")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.time")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.orders.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderColor: "var(--border)" }}>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        style={{ color: "var(--primary)", fontWeight: 600 }}>
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
                        <span
                          className="font-medium"
                          style={{ color: "var(--text)" }}>
                          {order.customerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span style={{ color: "var(--text-muted)" }}>
                        Table {order.tableCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span style={{ color: "var(--text-muted)" }}>
                        {order.items} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-500 font-bold">
                        {order.totalQuantity} món
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
                        {order.paymentStatus === "paid"
                          ? t("dashboard.orders.payment_status.paid")
                          : t("dashboard.orders.payment_status.unpaid")}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {order.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          className="p-2 rounded-lg transition-all"
                          style={{
                            backgroundColor: "var(--primary-soft)",
                            color: "var(--primary)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(255,56,11,0.2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(255,56,11,0.1)")
                          }
                          suppressHydrationWarning
                          onClick={async () => {
                            setSelectedOrder(order);
                            // load dish names for details
                            const details = order.raw.orderDetails ?? [];
                            const mapped = await Promise.all(
                              details.map(async (d) => {
                                try {
                                  const dish = await menuService.getDishById(
                                    d.dishId,
                                  );
                                  return { id: d.dishId, name: dish.name, quantity: d.quantity };
                                } catch (err) {
                                  return { id: d.dishId, name: undefined, quantity: d.quantity };
                                }
                              }),
                            );
                            setSelectedOrderDetails(mapped);
                            setDetailOpen(true);
                          }}
                          title="View Details">
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
                        {/* Edit disabled for admin; orders are view-only here */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail Overlay */}
        {detailOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div
              className="w-full max-w-xl rounded-2xl shadow-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                    {t("dashboard.orders.title")} {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Table {selectedOrder.tableCode}
                  </p>
                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition"
                  onClick={() => setDetailOpen(false)}>
                  <span className="text-lg" style={{ color: "var(--text-muted)" }}>
                    ×
                  </span>
                </button>
              </div>

              <div className="px-6 py-4 max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--text-muted)" }}>
                      <th className="text-left pb-2">Dish</th>
                      <th className="text-right pb-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrderDetails ?? selectedOrder?.raw.orderDetails ?? []).map((d) => (
                      <tr key={(d as any).id ?? (d as any).dishId}>
                        <td className="py-1.5" style={{ color: "var(--text)" }}>
                          {typeof (d as any).name === "string" && (d as any).name
                            ? (d as any).name
                            : (d as any).dishId ?? (d as any).id}
                        </td>
                        <td className="py-1.5 text-right" style={{ color: "var(--text-muted)" }}>
                          {(d as any).quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className="flex items-center justify-between px-6 py-4 border-t"
                style={{ borderColor: "var(--border)" }}>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.orders.table.total")}
                </span>
                <span className="text-lg font-semibold text-green-500">
                  {selectedOrder.total.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
