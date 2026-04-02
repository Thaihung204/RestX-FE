"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

export default function QuickActions() {
  const { t } = useTranslation();
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: "orders",
      title: t("dashboard.quick_actions.orders"),
      description: t("dashboard.quick_actions.orders_desc"),
      color: "#F97316",
      path: "/admin/orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: "reservations",
      title: t("dashboard.quick_actions.reservations"),
      description: t("dashboard.quick_actions.reservations_desc"),
      color: "#3b82f6",
      path: "/admin/reservations",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "menu",
      title: t("dashboard.quick_actions.menu"),
      description: t("dashboard.quick_actions.menu_desc"),
      color: "#22c55e",
      path: "/admin/menu",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: "staff",
      title: t("dashboard.quick_actions.staff"),
      description: t("dashboard.quick_actions.staff_desc"),
      color: "#a855f7",
      path: "/admin/staff",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "analytics",
      title: t("dashboard.quick_actions.analytics"),
      description: t("dashboard.quick_actions.analytics_desc"),
      color: "#f59e0b",
      path: "/admin/analytics",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "settings",
      title: t("dashboard.quick_actions.settings"),
      description: t("dashboard.quick_actions.settings_desc"),
      color: "#6b7280",
      path: "/admin/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="rounded-xl p-5 h-full"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
            {t("dashboard.quick_actions.title")}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.quick_actions.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => router.push(action.path)}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
            suppressHydrationWarning>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110"
              style={{ background: action.color }}>
              {action.icon}
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold leading-tight" style={{ color: "var(--text)" }}>
                {action.title}
              </p>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--text-muted)" }}>
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
