"use client";

import AIPanelDashboard, {
  AIReportFilterOption,
  AIStrategyReport,
} from "@/components/admin/AIPanelDashboard";
import BestSellingDishesCard from "@/components/admin/BestSellingDishesCard";
import KPISection from "@/components/admin/KPISection";
import LatestFeedbacksCard from "@/components/admin/LatestFeedbacksCard";
import OrdersBarChart from "@/components/admin/charts/OrdersBarChart";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import ReservationList from "@/components/admin/reservations/ReservationList";
import aiService from "@/lib/services/aiService";
import dashboardService, {
  DashboardFilterType,
  DashboardOverview,
  DashboardSummary,
  OrderTrendPoint,
  RevenueTrendPoint,
} from "@/lib/services/dashboardService";
import reportService, { ReportType } from "@/lib/services/reportService";
import reservationService, {
  PaginatedReservations,
} from "@/lib/services/reservationService";
import { triggerBrowserDownload } from "@/lib/utils/fileDownload";
import { DownloadOutlined } from "@ant-design/icons";
import { App } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type DashboardFilterOption = "day" | "week" | "month" | "year";

const BE_TZ_OFFSET_MINUTES = 7 * 60;
const BE_TZ_OFFSET_MS = BE_TZ_OFFSET_MINUTES * 60 * 1000;
const BE_TZ_OFFSET_LABEL = "+07:00";

//KPIs card
const filterToApiType: Record<DashboardFilterOption, DashboardFilterType> = {
  day: "today",
  week: "week",
  month: "month",
  year: "year",
};

const filterToReportType: Record<DashboardFilterOption, ReportType> = {
  day: "weekly",
  week: "weekly",
  month: "monthly",
  year: "yearly",
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toBusinessPseudoDate = (date: Date) =>
  new Date(date.getTime() + BE_TZ_OFFSET_MS);

const fromBusinessPseudoDate = (date: Date) =>
  new Date(date.getTime() - BE_TZ_OFFSET_MS);

const startOfDay = (date: Date) => {
  const d = toBusinessPseudoDate(date);
  d.setUTCHours(0, 0, 0, 0);
  return fromBusinessPseudoDate(d);
};

const addDays = (date: Date, days: number) => {
  const d = toBusinessPseudoDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromBusinessPseudoDate(d);
};

const addMonths = (date: Date, months: number) => {
  const d = toBusinessPseudoDate(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return fromBusinessPseudoDate(d);
};

const addYears = (date: Date, years: number) => {
  const d = toBusinessPseudoDate(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return fromBusinessPseudoDate(d);
};

const startOfMonth = (date: Date) => {
  const d = toBusinessPseudoDate(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(1);
  return fromBusinessPseudoDate(d);
};

const startOfYear = (date: Date) => {
  const d = toBusinessPseudoDate(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(0, 1);
  return fromBusinessPseudoDate(d);
};

const toIso = (date: Date) => {
  const d = toBusinessPseudoDate(date);

  const year = d.getUTCFullYear();
  const month = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  const hours = pad2(d.getUTCHours());
  const minutes = pad2(d.getUTCMinutes());
  const seconds = pad2(d.getUTCSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${BE_TZ_OFFSET_LABEL}`;
};

const parseDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDayMonth = (value: string) => {
  const d = parseDate(value);
  if (d) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}`;
  }

  const dayMonthMatch = value.match(/^(\d{2})[-\/](\d{2})$/);
  if (dayMonthMatch) {
    return `${dayMonthMatch[1]}/${dayMonthMatch[2]}`;
  }

  return value.replace(/-/g, "/");
};

const formatMonthYear = (value: string) => {
  const d = parseDate(value);
  if (!d) return value;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
};

const getYear = (value: string) => {
  const d = parseDate(value);
  return d ? d.getFullYear() : NaN;
};

const formatWeekRange = (start: string, end: string) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!startDate || !endDate) return "";

  const startDay = startDate.toLocaleDateString("vi-VN", { day: "2-digit" });
  const startMonth = startDate.toLocaleDateString("vi-VN", {
    month: "2-digit",
  });
  const endDay = endDate.toLocaleDateString("vi-VN", { day: "2-digit" });
  const endMonth = endDate.toLocaleDateString("vi-VN", { month: "2-digit" });

  if (startMonth === endMonth) {
    return `${startDay}-${endDay}/${endMonth}`;
  }

  return `${startDay}/${startMonth}-${endDay}/${endMonth}`;
};

// chart
const getTrendQuery = (filter: DashboardFilterOption) => {
  const today = startOfDay(new Date());

  switch (filter) {
    case "day": {
      const fromDate = addDays(today, -6);
      return {
        filterType: "week" as DashboardFilterType,
        fromDate: toIso(fromDate),
        toDate: toIso(today),
      };
    }
    case "week": {
      const fromDate = addDays(today, -27);
      return {
        filterType: "week" as DashboardFilterType,
        fromDate: toIso(fromDate),
        toDate: toIso(today),
      };
    }
    case "month": {
      const fromDate = startOfMonth(addMonths(today, -5));
      return {
        filterType: "year" as DashboardFilterType,
        fromDate: toIso(fromDate),
        toDate: toIso(today),
      };
    }
    case "year": {
      const fromDate = startOfYear(addYears(today, -4));
      return {
        filterType: "year" as DashboardFilterType,
        fromDate: toIso(fromDate),
        toDate: toIso(today),
      };
    }
    default:
      return {
        filterType: filterToApiType[filter],
      };
  }
};

const normalizeRevenueChartData = (
  filter: DashboardFilterOption,
  points: RevenueTrendPoint[] = [],
): RevenueTrendPoint[] => {
  if (!points.length) return [];

  if (filter === "day") {
    return points.slice(-7).map((p) => ({
      ...p,
      label: formatDayMonth(p.date),
    }));
  }

  if (filter === "week") {
    const daily = points.slice(-28);
    const grouped: RevenueTrendPoint[] = [];

    for (let i = 0; i < daily.length; i += 7) {
      const chunk = daily.slice(i, i + 7);
      if (!chunk.length) continue;

      grouped.push({
        date: chunk[0].date,
        value: chunk.reduce((sum, item) => sum + item.value, 0),
        label: formatWeekRange(chunk[0].date, chunk[chunk.length - 1].date),
      });
    }

    return grouped.slice(-4);
  }

  if (filter === "month") {
    return points.slice(-6).map((p) => ({
      ...p,
      label: formatMonthYear(p.date),
    }));
  }

  const byYear = new Map<number, number>();

  points.forEach((p) => {
    const year = getYear(p.date);
    if (!Number.isFinite(year)) return;
    byYear.set(year, (byYear.get(year) ?? 0) + p.value);
  });

  return Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-5)
    .map(([year, total]) => ({
      date: `${year}-01-01`,
      value: total,
      label: `${year}`,
    }));
};

const normalizeOrderChartData = (
  filter: DashboardFilterOption,
  points: OrderTrendPoint[] = [],
): OrderTrendPoint[] => {
  if (!points.length) return [];

  if (filter === "day") {
    return points.slice(-7).map((p) => ({
      ...p,
      label: formatDayMonth(p.date),
    }));
  }

  if (filter === "week") {
    const daily = points.slice(-28);
    const grouped: OrderTrendPoint[] = [];

    for (let i = 0; i < daily.length; i += 7) {
      const chunk = daily.slice(i, i + 7);
      if (!chunk.length) continue;

      grouped.push({
        date: chunk[0].date,
        total: chunk.reduce((sum, item) => sum + item.total, 0),
        label: formatWeekRange(chunk[0].date, chunk[chunk.length - 1].date),
      });
    }

    return grouped.slice(-4);
  }

  if (filter === "month") {
    return points.slice(-6).map((p) => ({
      ...p,
      label: formatMonthYear(p.date),
    }));
  }

  const byYear = new Map<number, number>();

  points.forEach((p) => {
    const year = getYear(p.date);
    if (!Number.isFinite(year)) return;
    byYear.set(year, (byYear.get(year) ?? 0) + p.total);
  });

  return Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-5)
    .map(([year, total]) => ({
      date: `${year}-01-01`,
      total,
      label: `${year}`,
    }));
};

export default function DashboardPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [reservationData, setReservationData] =
    useState<PaginatedReservations | null>(null);
  const [reservationLoading, setReservationLoading] = useState(true);
  const [reservationPage, setReservationPage] = useState(1);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [overviewData, setOverviewData] = useState<DashboardOverview | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardFilter, setDashboardFilter] =
    useState<DashboardFilterOption>("week");
  const [exportingReport, setExportingReport] = useState(false);
  const [aiReport, setAiReport] = useState<AIStrategyReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFilter, setAiFilter] = useState<AIReportFilterOption>("month");

  const filterOptions: DashboardFilterOption[] = [
    "day",
    "week",
    "month",
    "year",
  ];

  const fetchDashboardData = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const trendQuery = getTrendQuery(dashboardFilter);

      const [summaryResult, overviewResult] = await Promise.all([
        dashboardService.getSummary({
          filterType: filterToApiType[dashboardFilter],
        }),
        dashboardService.getOverview({
          filterType: trendQuery.filterType,
          fromDate: trendQuery.fromDate,
          toDate: trendQuery.toDate,
          top: 5,
          sortBy: "revenue",
        }),
      ]);

      setSummaryData(summaryResult);
      setOverviewData(overviewResult);
    } catch (error) {
      console.error(error);
      setDashboardError(
        error instanceof Error
          ? error.message
          : t("dashboard.messages.overview_load_failed"),
      );
    } finally {
      setDashboardLoading(false);
    }
  }, [dashboardFilter, t]);

  const revenueChartData = useMemo(
    () =>
      normalizeRevenueChartData(
        dashboardFilter,
        overviewData?.revenueTrend?.revenueTrends,
      ),
    [dashboardFilter, overviewData?.revenueTrend?.revenueTrends],
  );

  const orderChartData = useMemo(
    () =>
      normalizeOrderChartData(
        dashboardFilter,
        overviewData?.orderTrend?.orderTrends,
      ),
    [dashboardFilter, overviewData?.orderTrend?.orderTrends],
  );

  const chartPeriodSubtitle = useMemo(() => {
    switch (dashboardFilter) {
      case "day":
        return t("charts.periods.last_7_days");
      case "week":
        return t("charts.periods.last_4_weeks");
      case "month":
        return t("charts.periods.last_6_months");
      case "year":
        return t("charts.periods.last_5_years");
      default:
        return "";
    }
  }, [dashboardFilter, t]);

  const totalRevenueForChart = useMemo(
    () =>
      overviewData?.revenueTrend?.totalRevenue ??
      revenueChartData.reduce((sum, item) => sum + item.value, 0),
    [overviewData?.revenueTrend?.totalRevenue, revenueChartData],
  );

  const totalOrdersForChart = useMemo(
    () =>
      overviewData?.orderTrend?.totalOrders ??
      orderChartData.reduce((sum, item) => sum + item.total, 0),
    [overviewData?.orderTrend?.totalOrders, orderChartData],
  );

  const generateAIReport = useCallback(async (filter: AIReportFilterOption) => {
    setAiFilter(filter);
    setAiLoading(true);
    try {
      const apiFilterType = filter === "month" ? "month" : filter;
      const response = await aiService.analyzeDashboard({ filterType: apiFilterType });
      setAiReport({
        ...response,
        id: response.id || `report-${Date.now()}`,
        generatedAt: response.generatedAt || new Date().toISOString(),
      });
      message.success(t("dashboard.analytics.success.generate"));
    } catch (err) {
      console.error(err);
      message.error(t("dashboard.analytics.error.generate"));
    } finally {
      setAiLoading(false);
    }
  }, [message, t]);

  const fetchReservations = useCallback(async () => {
    setReservationLoading(true);
    try {
      const result = await reservationService.getReservations({
        pageNumber: reservationPage,
        pageSize: 5,
        sortBy: "reservationDateTime",
        sortDescending: false,
      });
      setReservationData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setReservationLoading(false);
    }
  }, [reservationPage]);

  const handleExportReport = useCallback(async () => {
    setExportingReport(true);
    try {
      const file = await reportService.exportReport({
        reportType: filterToReportType[dashboardFilter],
      });

      triggerBrowserDownload(file.blob, file.fileName);
      message.success(t("dashboard.messages.export_success"));
    } catch (error) {
      console.error("Failed to export report:", error);
      message.error(t("dashboard.messages.export_failed"));
    } finally {
      setExportingReport(false);
    }
  }, [dashboardFilter, message, t]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return (
    <main
      className="flex-1 p-6 lg:p-8"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {filterOptions.map((option) => {
              const isActive = dashboardFilter === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDashboardFilter(option)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: isActive ? "var(--primary)" : "var(--card)",
                    color: isActive ? "#fff" : "var(--text)",
                    border: isActive
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border)",
                  }}>
                  {t(`dashboard.filters.${option}`)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportReport}
              disabled={exportingReport}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: "var(--primary-soft)",
                border: "1px solid var(--primary-border)",
                color: "var(--primary)",
              }}>
              <DownloadOutlined />
              {exportingReport
                ? t("common.actions.exporting")
                : t("dashboard.actions.export_report")}
            </button>
          </div>
        </div>

        <section>

          {dashboardError && (
            <p className="text-sm mb-3" style={{ color: "#ef4444" }}>
              {dashboardError}
            </p>
          )}

          <KPISection
            summary={summaryData}
            loading={dashboardLoading && !summaryData}
            filter={dashboardFilter}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart
            data={revenueChartData}
            totalRevenue={totalRevenueForChart}
            subtitle={chartPeriodSubtitle}
          />
          <OrdersBarChart
            data={orderChartData}
            totalOrders={totalOrdersForChart}
            subtitle={chartPeriodSubtitle}
          />
        </section>

        <section>
          <AIPanelDashboard
            report={aiReport}
            loading={aiLoading}
            onGenerate={generateAIReport}
            currentFilter={aiFilter}
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LatestFeedbacksCard loading={dashboardLoading && !summaryData} />          <BestSellingDishesCard 
            dishes={overviewData?.topDishes?.dishes}
            loading={dashboardLoading && !overviewData}
          />
        </section>

        <section>
          <ReservationList
            data={reservationData}
            loading={reservationLoading}
            setPage={setReservationPage}
            onStatusUpdated={fetchReservations}
          />
        </section>
      </div>
    </main>
  );
}
