"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useState } from "react";

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  area: "VIP" | "Indoor" | "Outdoor";
  currentOrder?: string;
  reservationTime?: string;
}

export default function TablesPage() {
  const [tables] = useState<Table[]>([
    {
      id: "1",
      number: 1,
      capacity: 4,
      status: "occupied",
      area: "VIP",
      currentOrder: "#ORD-001",
    },
    {
      id: "2",
      number: 2,
      capacity: 6,
      status: "reserved",
      area: "VIP",
      reservationTime: "19:00",
    },
    { id: "3", number: 3, capacity: 4, status: "available", area: "VIP" },
    {
      id: "4",
      number: 4,
      capacity: 2,
      status: "occupied",
      area: "Indoor",
      currentOrder: "#ORD-002",
    },
    { id: "5", number: 5, capacity: 4, status: "available", area: "Indoor" },
    { id: "6", number: 6, capacity: 4, status: "cleaning", area: "Indoor" },
    {
      id: "7",
      number: 7,
      capacity: 6,
      status: "reserved",
      area: "Indoor",
      reservationTime: "20:00",
    },
    { id: "8", number: 8, capacity: 4, status: "available", area: "Outdoor" },
    {
      id: "9",
      number: 9,
      capacity: 2,
      status: "occupied",
      area: "Outdoor",
      currentOrder: "#ORD-003",
    },
  ]);

  const statusConfig = {
    available: {
      color: "bg-green-500",
      text: "Available",
      badge: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    occupied: {
      color: "bg-orange-500",
      text: "Occupied",
      badge: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    },
    reserved: {
      color: "bg-blue-500",
      text: "Reserved",
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    cleaning: {
      color: "bg-red-500",
      text: "Cleaning",
      badge: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                  Table Management
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  Manage restaurant tables and reservations
                </p>
              </div>
              <button
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-medium hover:from-orange-500 hover:to-orange-400 transition-all"
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
                Add Table
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Total Tables
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text)' }}>
                      {tables.length}
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
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
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
                      Available
                    </p>
                    <p className="text-3xl font-bold text-green-500 mt-1">
                      {tables.filter((t) => t.status === "available").length}
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

              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Occupied
                    </p>
                    <p className="text-3xl font-bold text-orange-500 mt-1">
                      {tables.filter((t) => t.status === "occupied").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
                      Reserved
                    </p>
                    <p className="text-3xl font-bold text-blue-500 mt-1">
                      {tables.filter((t) => t.status === "reserved").length}
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>
                All Tables
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="rounded-xl p-4 transition-all hover:border-orange-500/50"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                    }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                          Table {table.number}
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {table.area} Area
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          statusConfig[table.status].badge
                        }`}>
                        {statusConfig[table.status].text}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>Capacity: {table.capacity} seats</span>
                      </div>
                      {table.currentOrder && (
                        <div className="flex items-center gap-2 text-sm text-orange-500">
                          <svg
                            className="w-4 h-4"
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
                          <span>Order: {table.currentOrder}</span>
                        </div>
                      )}
                      {table.reservationTime && (
                        <div className="flex items-center gap-2 text-sm text-blue-500">
                          <svg
                            className="w-4 h-4"
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
                          <span>Reserved at {table.reservationTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-3 py-2 bg-orange-500/10 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-500/20 transition-all"
                        suppressHydrationWarning>
                        View Details
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: 'var(--surface)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}
                        suppressHydrationWarning>
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
