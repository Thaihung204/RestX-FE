"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  tableNumber: number;
  items: number;
  total: number;
  status:
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";
  time: string;
  paymentStatus: "unpaid" | "paid";
}

export default function OrdersPage() {
  const { t } = useTranslation("common");
  const [orders] = useState<Order[]>([
    {
      id: "1",
      orderNumber: "#ORD-001",
      customerName: "John Doe",
      tableNumber: 5,
      items: 3,
      total: 2137500,
      status: "preparing",
      time: "10 mins ago",
      paymentStatus: "unpaid",
    },
    {
      id: "2",
      orderNumber: "#ORD-002",
      customerName: "Sarah Wilson",
      tableNumber: 12,
      items: 2,
      total: 1550000,
      status: "ready",
      time: "15 mins ago",
      paymentStatus: "unpaid",
    },
    {
      id: "3",
      orderNumber: "#ORD-003",
      customerName: "Mike Johnson",
      tableNumber: 8,
      items: 4,
      total: 3125000,
      status: "served",
      time: "25 mins ago",
      paymentStatus: "paid",
    },
    {
      id: "4",
      orderNumber: "#ORD-004",
      customerName: "Emma Brown",
      tableNumber: 3,
      items: 2,
      total: 1212500,
      status: "pending",
      time: "5 mins ago",
      paymentStatus: "unpaid",
    },
    {
      id: "5",
      orderNumber: "#ORD-005",
      customerName: "David Lee",
      tableNumber: 15,
      items: 5,
      total: 3918750,
      status: "completed",
      time: "1 hour ago",
      paymentStatus: "paid",
    },
  ]);

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
      color: "bg-[#FF380B]",
      text: t("dashboard.orders.status.served"),
      badge: "text-[#FF380B] border-[rgba(255,56,11,0.2)]",
      bgStyle: { backgroundColor: 'rgba(255,56,11,0.1)' },
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

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              {t("dashboard.orders.title")}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {t("dashboard.orders.subtitle")}
            </p>
          </div>
          <button
            className="px-4 py-2 text-white rounded-lg font-medium transition-all"
            style={{ background: 'linear-gradient(to right, #FF380B, #CC2D08)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #CC2D08, #B32607)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #FF380B, #CC2D08)'}
            suppressHydrationWarning>
            <svg
              className="w-5 h-5 inline-block mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {t("dashboard.orders.new_order")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--card)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t("dashboard.orders.stats.pending")}
                </p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">
                  {orders.filter((o) => o.status === "pending").length}
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
<<<<<<< HEAD
=======
                {t("dashboard.orders.new_order")}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.orders.stats.pending")}
                    </p>
                    <p className="text-3xl font-bold text-yellow-500 mt-1">
                      {orders.filter((o) => o.status === "pending").length}
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
                  background: 'var(--card)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.orders.stats.preparing")}
                    </p>
                    <p className="text-3xl font-bold text-blue-500 mt-1">
                      {orders.filter((o) => o.status === "preparing").length}
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
                  background: 'var(--card)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.orders.stats.ready")}
                    </p>
                    <p className="text-3xl font-bold text-purple-500 mt-1">
                      {orders.filter((o) => o.status === "ready").length}
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
                  background: 'var(--card)',
                  border: '1px solid rgba(255, 56, 11, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.orders.stats.served")}
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{color: '#FF380B'}}>
                      {orders.filter((o) => o.status === "served").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'rgba(255,56,11,0.1)'}}>
                    <svg
                      className="w-6 h-6"
                      style={{color: '#FF380B'}}
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
                  background: 'var(--card)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.orders.stats.completed")}
                    </p>
                    <p className="text-3xl font-bold text-green-500 mt-1">
                      {orders.filter((o) => o.status === "completed").length}
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
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <div
                className="p-6"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                  {t("dashboard.orders.title")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'var(--surface)' }}>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.order")}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.customer")}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.table")}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.items")}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.total")}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.status")}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.payment")}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.time")}
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.orders.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ borderColor: 'var(--border)' }}>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span style={{color: '#FF380B', fontWeight: 600}}>
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{background: 'linear-gradient(135deg, #FF380B 0%, #CC2D08 100%)'}}>
                              {order.customerName.charAt(0)}
                            </div>
                            <span className="font-medium" style={{ color: 'var(--text)' }}>
                              {order.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span style={{ color: 'var(--text-muted)' }}>
                            {t("dashboard.orders.table.table")} {order.tableNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span style={{ color: 'var(--text-muted)' }}>
                            {order.items} {t("dashboard.orders.table.items").toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-500 font-bold">
                            {order.total.toLocaleString('vi-VN')}đ
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[order.status].badge
                              }`}>
                            {statusConfig[order.status].text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${order.paymentStatus === "paid"
                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                : "bg-red-500/10 text-red-500 border border-red-500/20"
                              }`}>
                            {order.paymentStatus === "paid" ? t("dashboard.orders.payment_status.paid") : t("dashboard.orders.payment_status.unpaid")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                          {order.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              className="p-2 rounded-lg transition-all"
                              style={{backgroundColor: 'rgba(255,56,11,0.1)', color: '#FF380B'}}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,56,11,0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,56,11,0.1)'}
                              suppressHydrationWarning
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
                            <button
                              className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-all"
                              suppressHydrationWarning
                              title="Edit Order">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
>>>>>>> 94d9ab9be690a46cbd51f3c1ec575f8ca86e575d
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--card)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t("dashboard.orders.stats.preparing")}
                </p>
                <p className="text-3xl font-bold text-blue-500 mt-1">
                  {orders.filter((o) => o.status === "preparing").length}
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
              background: 'var(--card)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t("dashboard.orders.stats.ready")}
                </p>
                <p className="text-3xl font-bold text-purple-500 mt-1">
                  {orders.filter((o) => o.status === "ready").length}
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
              background: 'var(--card)',
              border: '1px solid rgba(255, 56, 11, 0.2)',
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t("dashboard.orders.stats.served")}
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#FF380B' }}>
                  {orders.filter((o) => o.status === "served").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,56,11,0.1)' }}>
                <svg
                  className="w-6 h-6"
                  style={{ color: '#FF380B' }}
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
              background: 'var(--card)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t("dashboard.orders.stats.completed")}
                </p>
                <p className="text-3xl font-bold text-green-500 mt-1">
                  {orders.filter((o) => o.status === "completed").length}
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
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}>
          <div
            className="p-6"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              {t("dashboard.orders.title")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: 'var(--surface)' }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.order")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.customer")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.table")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.items")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.total")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.status")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.payment")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.time")}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.orders.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border)' }}>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span style={{ color: '#FF380B', fontWeight: 600 }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #FF380B 0%, #CC2D08 100%)' }}>
                          {order.customerName.charAt(0)}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text)' }}>
                          {order.customerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span style={{ color: 'var(--text-muted)' }}>
                        Table {order.tableNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span style={{ color: 'var(--text-muted)' }}>
                        {order.items} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-500 font-bold">
                        ${order.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[order.status].badge
                          }`}>
                        {statusConfig[order.status].text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${order.paymentStatus === "paid"
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}>
                        {order.paymentStatus === "paid" ? t("dashboard.orders.payment_status.paid") : t("dashboard.orders.payment_status.unpaid")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                      {order.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          className="p-2 rounded-lg transition-all"
                          style={{ backgroundColor: 'rgba(255,56,11,0.1)', color: '#FF380B' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,56,11,0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,56,11,0.1)'}
                          suppressHydrationWarning
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
                        <button
                          className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-all"
                          suppressHydrationWarning
                          title="Edit Order">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
