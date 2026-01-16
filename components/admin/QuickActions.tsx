"use client";

import React from "react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

export default function QuickActions() {
  const actions: QuickAction[] = [
    {
      id: "add-table",
      title: "Add Table",
      description: "Create new table",
      color: "", // Will use inline style
      icon: (
        <svg
          className="w-6 h-6"
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
      onClick: () => alert("Add Table - UI Demo"),
    },
    {
      id: "add-dish",
      title: "Add Dish",
      description: "Add menu item",
      color: "from-green-600 to-green-500",
      icon: (
        <svg
          className="w-6 h-6"
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
      onClick: () => alert("Add Dish - UI Demo"),
    },
    {
      id: "add-staff",
      title: "Add Staff",
      description: "New employee",
      color: "from-blue-600 to-blue-500",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      ),
      onClick: () => alert("Add Staff - UI Demo"),
    },
    {
      id: "view-bookings",
      title: "View Bookings",
      description: "All reservations",
      color: "from-purple-600 to-purple-500",
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      onClick: () => alert("View Bookings - UI Demo"),
    },
    {
      id: "inventory",
      title: "Inventory",
      description: "Stock management",
      color: "from-yellow-600 to-yellow-500",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      onClick: () => alert("Inventory - UI Demo"),
    },
    {
      id: "reports",
      title: "Reports",
      description: "Analytics & data",
      color: "from-red-600 to-red-500",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      onClick: () => alert("Reports - UI Demo"),
    },
  ];

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
          Quick Actions
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Frequently used shortcuts
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="group relative rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            suppressHydrationWarning>
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg ${
                action.color ? `bg-gradient-to-br ${action.color}` : ''
              }`}
              style={action.id === 'add-table' ? {
                background: 'linear-gradient(to right, #FF380B, #FF380B)'
              } : undefined}>
              {action.icon}
            </div>

            {/* Text */}
            <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
              {action.title}
            </h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {action.description}
            </p>

            {/* Hover effect */}
            <div className="absolute inset-0 rounded-xl transition-all duration-300" style={{ background: 'linear-gradient(to bottom right, rgba(255, 56, 11, 0), rgba(255, 56, 11, 0))' }} onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(255, 56, 11, 0.05), rgba(255, 56, 11, 0.1))'} onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(255, 56, 11, 0), rgba(255, 56, 11, 0))'}></div>
          </button>
        ))}
      </div>
    </div>
  );
}
