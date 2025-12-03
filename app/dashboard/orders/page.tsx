"use client";

import React, { useState } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  tableNumber: number;
  items: number;
  total: number;
  status: "pending" | "preparing" | "ready" | "served" | "completed" | "cancelled";
  time: string;
  paymentStatus: "unpaid" | "paid";
}

export default function OrdersPage() {
  const [orders] = useState<Order[]>([
    {
      id: "1",
      orderNumber: "#ORD-001",
      customerName: "John Doe",
      tableNumber: 5,
      items: 3,
      total: 85.50,
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
      total: 62.00,
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
      total: 124.99,
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
      total: 48.50,
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
      total: 156.75,
      status: "completed",
      time: "1 hour ago",
      paymentStatus: "paid",
    },
  ]);

  const statusConfig = {
    pending: { color: "bg-yellow-500", text: "Pending", badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    preparing: { color: "bg-blue-500", text: "Preparing", badge: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    ready: { color: "bg-purple-500", text: "Ready", badge: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    served: { color: "bg-orange-500", text: "Served", badge: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    completed: { color: "bg-green-500", text: "Completed", badge: "bg-green-500/10 text-green-500 border-green-500/20" },
    cancelled: { color: "bg-red-500", text: "Cancelled", badge: "bg-red-500/10 text-red-500 border-red-500/20" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Order Management</h2>
                <p className="text-gray-400">Track and manage all restaurant orders</p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-medium hover:from-orange-500 hover:to-orange-400 transition-all" suppressHydrationWarning>
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Order
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-3xl font-bold text-yellow-500 mt-1">{orders.filter(o => o.status === "pending").length}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Preparing</p>
                    <p className="text-3xl font-bold text-blue-500 mt-1">{orders.filter(o => o.status === "preparing").length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Ready</p>
                    <p className="text-3xl font-bold text-purple-500 mt-1">{orders.filter(o => o.status === "ready").length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Served</p>
                    <p className="text-3xl font-bold text-orange-500 mt-1">{orders.filter(o => o.status === "served").length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-3xl font-bold text-green-500 mt-1">{orders.filter(o => o.status === "completed").length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-bold text-white">All Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Table</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-orange-500 font-semibold">{order.orderNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {order.customerName.charAt(0)}
                            </div>
                            <span className="text-white font-medium">{order.customerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-300">Table {order.tableNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-300">{order.items} items</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-500 font-bold">${order.total.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[order.status].badge}`}>
                            {statusConfig[order.status].text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.paymentStatus === "paid"
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}>
                            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                          {order.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-all" suppressHydrationWarning title="View Details">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-all" suppressHydrationWarning title="Edit Order">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
      </div>
    </div>
  );
}
