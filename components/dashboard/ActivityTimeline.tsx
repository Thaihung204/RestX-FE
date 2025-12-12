"use client";

import React from "react";

interface Activity {
  id: number;
  type: "booking" | "menu" | "payment" | "staff";
  message: string;
  time: string;
  icon: React.ReactNode;
}

const activities: Activity[] = [
  {
    id: 1,
    type: "booking",
    message: "Customer John Doe booked table V2 for 6 guests",
    time: "2 minutes ago",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
  {
    id: 2,
    type: "menu",
    message: "Chef added new dish: Truffle Pasta to menu",
    time: "15 minutes ago",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
  {
    id: 3,
    type: "payment",
    message: "Bill #1247 paid successfully - $185.50",
    time: "22 minutes ago",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
  {
    id: 4,
    type: "staff",
    message: "Waiter Sarah completed order for table I2",
    time: "35 minutes ago",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
  {
    id: 5,
    type: "booking",
    message: "Customer Emily booked table O1 for 4 guests",
    time: "48 minutes ago",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
  {
    id: 6,
    type: "payment",
    message: "Bill #1245 paid successfully - $124.00",
    time: "1 hour ago",
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
  },
];

const typeColors: Record<Activity["type"], string> = {
  booking: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  menu: "bg-green-500/10 text-green-500 border-green-500/20",
  payment: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  staff: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function ActivityTimeline() {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Recent Activities
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Live activity feed
          </p>
        </div>
        <button
          className="text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors"
          suppressHydrationWarning>
          View All
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex gap-4 group p-3 rounded-lg transition-all duration-200 cursor-pointer"
            style={{ background: "var(--surface)" }}>
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${
                typeColors[activity.type]
              }`}>
              {activity.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                {activity.message}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {activity.time}
              </p>
            </div>

            {/* Indicator */}
            {index < 2 && (
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--card);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
