"use client";

import KPICard from "./KPICard";

export default function KPISection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <KPICard
        title="Today's Bookings"
        value={24}
        subtitle="8 pending confirmations"
        trend={{ value: 12, isPositive: true }}
        icon={
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
      />

      <KPICard
        title="Available Tables"
        value="12/40"
        subtitle="VIP: 3, Indoor: 7, Outdoor: 2"
        status="normal"
        icon={
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
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        }
      />

      <KPICard
        title="Today's Revenue"
        value="$4,850"
        subtitle="Target: $6,000"
        trend={{ value: 18, isPositive: true }}
        status="success"
        icon={
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />

      <KPICard
        title="Active Orders"
        value={18}
        subtitle="6 waiting, 12 in-progress"
        status="warning"
        icon={
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
        }
      />

      <KPICard
        title="Top Selling Dish"
        value="Grilled Salmon"
        subtitle="42 orders today"
        trend={{ value: 25, isPositive: true }}
        icon={
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        }
      />

      <KPICard
        title="Kitchen Status"
        value="Busy"
        subtitle="8 orders in queue"
        status="warning"
        icon={
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
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
            />
          </svg>
        }
      />
    </div>
  );
}
