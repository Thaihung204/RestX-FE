"use client";

import { useTranslation } from "react-i18next";
import KPICard from "./KPICard";

export default function KPISection() {
  const { t } = useTranslation();

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title={t("dashboard.kpi.revenue")}
        value={formatVND(12450000)}
        subtitle={t("dashboard.kpi.revenue_subtitle", { target: formatVND(15000000) })}
        trend={{ value: 18, isPositive: true }}
        iconBg="rgba(34, 197, 94, 0.1)"
        iconColor="#22c55e"
        borderAccent="rgba(34, 197, 94, 0.2)"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <KPICard
        title={t("dashboard.kpi.orders")}
        value={67}
        subtitle={t("dashboard.kpi.orders_subtitle", { completed: 52, processing: 15 })}
        trend={{ value: 12, isPositive: true }}
        iconBg="rgba(255, 56, 11, 0.1)"
        iconColor="var(--primary)"
        borderAccent="rgba(255, 56, 11, 0.2)"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />

      <KPICard
        title={t("dashboard.kpi.reservations")}
        value={24}
        subtitle={t("dashboard.kpi.reservations_subtitle", { pending: 8 })}
        iconBg="rgba(59, 130, 246, 0.1)"
        iconColor="#3b82f6"
        borderAccent="rgba(59, 130, 246, 0.2)"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />

      <KPICard
        title={t("dashboard.kpi.new_customers")}
        value={156}
        subtitle={t("dashboard.kpi.new_customers_subtitle")}
        trend={{ value: 23, isPositive: true }}
        iconBg="rgba(168, 85, 247, 0.1)"
        iconColor="#a855f7"
        borderAccent="rgba(168, 85, 247, 0.2)"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />
    </div>
  );
}
