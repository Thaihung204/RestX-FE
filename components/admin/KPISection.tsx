"use client";

import type { DashboardSummary } from "@/lib/services/dashboardService";
import { useTranslation } from "react-i18next";
import KPICard from "./KPICard";

type DashboardFilterOption = "day" | "week" | "month" | "year";

interface KPISectionProps {
  summary?: DashboardSummary | null;
  loading?: boolean;
  filter?: DashboardFilterOption;
}

export default function KPISection({
  summary,
  loading = false,
  filter = "week",
}: KPISectionProps) {
  const { t } = useTranslation();

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  const toTrend = (changePercent?: number) => {
    if (typeof changePercent !== "number" || Number.isNaN(changePercent)) {
      return undefined;
    }

    return {
      value: changePercent,
      isPositive: changePercent >= 0,
    };
  };

  const formatRange = (fromDate?: string, toDate?: string) => {
    if (!fromDate || !toDate) return "";

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setUTCDate(to.getUTCDate() - 1);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "";

    const fromLabel = from.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
    const toLabel = to.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });

    return `${fromLabel} - ${toLabel}`;
  };

  const getTitleByFilter = (
    type: "revenue" | "orders" | "reservations" | "new_customers",
  ) => {
    switch (filter) {
      case "day":
        return t(`dashboard.kpi.titles.${type}.day`);
      case "week":
        return t(`dashboard.kpi.titles.${type}.week`);
      case "month":
        return t(`dashboard.kpi.titles.${type}.month`);
      case "year":
        return t(`dashboard.kpi.titles.${type}.year`);
      default:
        return "";
    }
  };

  const rangeLabel = formatRange(summary?.fromDate, summary?.toDate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title={getTitleByFilter("revenue")}
        value={loading ? "..." : formatVND(summary?.revenue.total ?? 0)}
        subtitle={rangeLabel}
        trend={!loading ? toTrend(summary?.revenue.changePercent) : undefined}
        iconBg="rgba(34, 197, 94, 0.1)"
        iconColor="#22c55e"
        borderAccent="rgba(34, 197, 94, 0.2)"
        icon={
          <svg
            className="w-6 h-6"
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
        title={getTitleByFilter("orders")}
        value={loading ? "..." : (summary?.orders.total ?? 0)}
        subtitle={t("dashboard.kpi.orders_subtitle", {
          completed: summary?.orders.completed ?? 0,
          processing: summary?.orders.liveProcessing ?? 0,
        })}
        iconBg="rgba(255, 56, 11, 0.1)"
        iconColor="var(--primary)"
        borderAccent="rgba(255, 56, 11, 0.2)"
        icon={
          <svg
            className="w-6 h-6"
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
        title={getTitleByFilter("reservations")}
        value={loading ? "..." : (summary?.reservations.total ?? 0)}
        subtitle={t("dashboard.kpi.reservations_subtitle", {
          pending: summary?.reservations.pending ?? 0,
        })}
        iconBg="rgba(59, 130, 246, 0.1)"
        iconColor="#3b82f6"
        borderAccent="rgba(59, 130, 246, 0.2)"
        icon={
          <svg
            className="w-6 h-6"
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
        title={getTitleByFilter("new_customers")}
        value={loading ? "..." : (summary?.newCustomers.total ?? 0)}
        subtitle={rangeLabel}
        trend={
          !loading ? toTrend(summary?.newCustomers.changePercent) : undefined
        }
        iconBg="rgba(168, 85, 247, 0.1)"
        iconColor="#a855f7"
        borderAccent="rgba(168, 85, 247, 0.2)"
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        }
      />
    </div>
  );
}
