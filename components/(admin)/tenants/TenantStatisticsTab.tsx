"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Spin } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { ITenant } from "@/lib/types/tenant";
import { useSnapshotData } from "@/app/lib/hooks/useSnapshotData";
import { KpiCards } from "@/app/components/admin/strategy-report/KpiCards";
import { BreakdownCharts } from "@/app/components/admin/strategy-report/BreakdownCharts";
import { PeriodType } from "@/app/lib/types/snapshot.types";
import { formatVND, formatCompletionRate } from "@/app/lib/utils/snapshot-formatters";
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';

type TenantStatisticsTabProps = {
  tenants: ITenant[];
  onViewDetails: (tenant: ITenant) => void;
};

type ActivityBand = "fresh" | "stale" | "idle";

const formatLastActive = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const getActivityBand = (value: string): ActivityBand => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "idle";

  const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) return "fresh";
  if (ageDays <= 30) return "stale";
  return "idle";
};

const TenantStatisticsTab: React.FC<TenantStatisticsTabProps> = ({ tenants, onViewDetails }) => {
  const { t } = useTranslation();

  const {
    state: snapshotState,
    fetchAllTenants,
    fetchTenantDetail,
    changePeriod,
  } = useSnapshotData();

  const [openTenantId, setOpenTenantId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  // Define useMemos BEFORE useEffects that depend on them
  const tenantSnapshotMap = useMemo(() => {
    const map = new Map<string, (typeof snapshotState.allTenantsData.tenants)[number]>();
    snapshotState.allTenantsData?.tenants.forEach((item) => {
      map.set(item.tenantId, item);
    });
    return map;
  }, [snapshotState.allTenantsData]);

  const selectedTenant = useMemo(() => {
    if (!openTenantId) return null;
    return tenants.find((tenant) => tenant.id === openTenantId) ?? null;
  }, [openTenantId, tenants]);

  const selectedSummary = useMemo(() => {
    if (!openTenantId) return null;
    return tenantSnapshotMap.get(openTenantId) ?? null;
  }, [openTenantId, tenantSnapshotMap]);

  const selectedDetail = useMemo(() => {
    if (!openTenantId) return null;
    if (!snapshotState.tenantDetailData) return null;
    if (snapshotState.tenantDetailData.tenantId !== openTenantId) return null;
    return snapshotState.tenantDetailData;
  }, [openTenantId, snapshotState.tenantDetailData]);

  useEffect(() => {
    fetchAllTenants("monthly");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openTenantId) return;
    fetchTenantDetail(openTenantId, snapshotState.periodType, snapshotState.customRange ?? undefined);
  }, [openTenantId, snapshotState.periodType, snapshotState.customRange, fetchTenantDetail]);

  useEffect(() => {
    if (!openTenantId) return;

    const animationFrame = window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [openTenantId]);

  const summary = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((tenant) => tenant.status === "active").length;
    const maintenance = tenants.filter((tenant) => tenant.status === "maintenance").length;
    const recent = tenants.filter((tenant) => getActivityBand(tenant.lastActive) === "fresh").length;
    return { total, active, maintenance, recent };
  }, [tenants]);

  const handlePeriodChange = (period: PeriodType) => {
    console.log(`[TenantStats] Period changed to: ${period}`, { currentTenantId: openTenantId });
    changePeriod(period);
  };

  const selectTenant = (tenantId: string) => {
    console.log(`[TenantStats] Selecting tenant: ${tenantId}`);
    setOpenTenantId((prev) => (prev === tenantId ? null : tenantId));
  };

  const closeDetail = () => {
    setOpenTenantId(null);
  };

  const sortedTenants = useMemo(() => {
    return [...tenants].sort((a, b) => {
      const revenueA = tenantSnapshotMap.get(a.id)?.revenue ?? 0;
      const revenueB = tenantSnapshotMap.get(b.id)?.revenue ?? 0;
      return revenueB - revenueA;
    });
  }, [tenants, tenantSnapshotMap]);

  const detailRevenue = selectedDetail?.revenue ?? selectedSummary?.revenue ?? 0;
  const detailTotalOrders = selectedDetail?.totalOrders ?? selectedSummary?.totalOrders ?? 0;
  const detailCompletedOrders = selectedDetail?.completedOrders ?? selectedSummary?.completedOrders ?? 0;
  const detailCancelledOrders = selectedDetail?.cancelledOrders ?? selectedSummary?.cancelledOrders ?? 0;
  const detailNewReservations = selectedDetail?.newReservations ?? selectedSummary?.newReservations ?? 0;

  const fallbackBreakdown = useMemo((): BreakdownEntry[] => {
    // If backend didn't return a breakdown, create a simple even distribution across the period
    if (selectedDetail && (!selectedDetail.breakdown || selectedDetail.breakdown.length === 0) && selectedSummary) {
      const period = snapshotState.periodType;
      const periodStart = selectedSummary.periodStart ? new Date(selectedSummary.periodStart) : new Date();
      const days = period === 'weekly' ? 7 : Math.max(1, Math.ceil((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));

      const revenue = Math.max(0, Math.floor(selectedSummary.revenue ?? 0));
      const orders = Math.max(0, Math.floor(selectedSummary.totalOrders ?? 0));
      const completed = Math.max(0, Math.floor(selectedSummary.completedOrders ?? 0));
      const cancelled = Math.max(0, Math.floor(selectedSummary.cancelledOrders ?? 0));
      const newCustomers = Math.max(0, Math.floor(selectedSummary.newCustomers ?? 0));
      const newReservations = Math.max(0, Math.floor(selectedSummary.newReservations ?? 0));

      const baseRev = Math.floor(revenue / days);
      let remRev = revenue - baseRev * days;
      const baseOrders = Math.floor(orders / days);
      let remOrders = orders - baseOrders * days;
      const completionRate = orders > 0 ? completed / orders : 0;
      const cancelledRate = orders > 0 ? cancelled / orders : 0;
      const baseCustomers = Math.floor(newCustomers / days);
      let remCustomers = newCustomers - baseCustomers * days;
      const baseReservations = Math.floor(newReservations / days);
      let remReservations = newReservations - baseReservations * days;

      const arr: BreakdownEntry[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(periodStart);
        d.setDate(d.getDate() + i);
        const dayRev = baseRev + (remRev > 0 ? 1 : 0);
        if (remRev > 0) remRev--;
        const dayOrders = baseOrders + (remOrders > 0 ? 1 : 0);
        if (remOrders > 0) remOrders--;
        const dayCompleted = Math.round(dayOrders * completionRate);
        const dayCancelled = Math.round(dayOrders * cancelledRate);
        const dayCustomers = baseCustomers + (remCustomers > 0 ? 1 : 0);
        if (remCustomers > 0) remCustomers--;
        const dayReservations = baseReservations + (remReservations > 0 ? 1 : 0);
        if (remReservations > 0) remReservations--;

        arr.push({
          date: d.toISOString(),
          revenue: dayRev,
          discountAmount: 0,
          totalOrders: dayOrders,
          completedOrders: dayCompleted,
          cancelledOrders: dayCancelled,
          newCustomers: dayCustomers,
          newReservations: dayReservations,
        });
      }

      return arr;
    }

    return selectedDetail?.breakdown ?? [];
  }, [selectedDetail, selectedSummary, snapshotState.periodType]);

  return (
    <div className="dashboard-animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Hero Section */}
      <div className="stats-hero">
        <div>
          <p className="stats-hero-label">{t("tenants.statistics.kicker")}</p>
          <h2 className="stats-hero-title">{t("tenants.statistics.title")}</h2>
          <p className="stats-hero-sub">{t("tenants.statistics.subtitle")}</p>
        </div>
        <div className="stats-hero-stats">
          <div className="stats-hero-stat">
            <div className="stats-hero-stat-val">{summary.total}</div>
            <div className="stats-hero-stat-label">{t("tenants.statistics.total_restaurants", { count: summary.total })}</div>
          </div>
          <div className="stats-hero-divider"></div>
          <div className="stats-hero-stat">
            <div className="stats-hero-stat-val" style={{ color: 'var(--success)' }}>{summary.active}</div>
            <div className="stats-hero-stat-label">{t("tenants.statistics.active_restaurants", { count: summary.active })}</div>
          </div>
        </div>
      </div>

      {/* Status KPI Cards */}
      <div className="stats-kpi-grid">
        <div className="stats-kpi-card" style={{ "--accent-color": "var(--primary)" } as React.CSSProperties}>
          <div className="stats-kpi-glow"></div>
          <div className="stats-kpi-label">{t("tenants.statistics.cards.total")}</div>
          <div className="stats-kpi-value">{summary.total}</div>
        </div>

        <div className="stats-kpi-card" style={{ "--accent-color": "var(--success)" } as React.CSSProperties}>
          <div className="stats-kpi-glow" style={{ background: "radial-gradient(circle, var(--success) 0%, transparent 70%)" }}></div>
          <div className="stats-kpi-label">{t("tenants.statistics.cards.active")}</div>
          <div className="stats-kpi-value">{summary.active}</div>
        </div>

        <div className="stats-kpi-card" style={{ "--accent-color": "#F97316" } as React.CSSProperties}>
          <div className="stats-kpi-glow" style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}></div>
          <div className="stats-kpi-label">{t("tenants.statistics.cards.maintenance")}</div>
          <div className="stats-kpi-value">{summary.maintenance}</div>
        </div>

        <div className="stats-kpi-card" style={{ "--accent-color": "#9B5CF6" } as React.CSSProperties}>
          <div className="stats-kpi-glow" style={{ background: "radial-gradient(circle, #9B5CF6 0%, transparent 70%)" }}></div>
          <div className="stats-kpi-label">{t("tenants.statistics.cards.recent")}</div>
          <div className="stats-kpi-value">{summary.recent}</div>
        </div>
      </div>

      {/* Revenue Overview Section */}
      <div className="ts-revenue-section">
        <div className="stats-section-row">
          <h3 className="stats-section-label">
            {t("strategyReport.revenueOverview")}
          </h3>
          <div className="stats-period-tabs">
            {(["daily", "monthly", "yearly"] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`stats-period-tab ${snapshotState.periodType === p ? "active" : ""}`}
                disabled={snapshotState.loading}
              >
                {t(`strategyReport.period.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue KPI Cards */}
        {snapshotState.loading && !snapshotState.allTenantsData ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <Spin size="large" />
          </div>
        ) : snapshotState.allTenantsData ? (
          <KpiCards
            totalRevenue={snapshotState.allTenantsData.totalRevenue}
            completedOrders={snapshotState.allTenantsData.completedOrders}
            totalOrders={snapshotState.allTenantsData.totalOrders}
            cancelledOrders={snapshotState.allTenantsData.cancelledOrders}
            newCustomers={snapshotState.allTenantsData.newCustomers}
          />
        ) : snapshotState.error ? (
          <div style={{ color: "var(--danger)", padding: "1rem" }}>
            {snapshotState.error}
          </div>
        ) : null}
      </div>

      {/* Tenant Table */}
      <div className="stats-section-row">
        <div className="stats-section-label">{t("tenants.statistics.table.restaurants_list")}</div>
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          {t("tenants.statistics.table.click_for_details")}
        </div>
      </div>

      <div className="stats-table-card">
        <table className="stats-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t("tenants.statistics.table.restaurant")}</th>
              <th>URL</th>
              <th style={{ textAlign: "right" }}>{t("strategyReport.table.revenue")}</th>
              <th style={{ textAlign: "center" }}>{t("tenants.statistics.table.orders")}</th>
              <th style={{ textAlign: "center" }}>{t("strategyReport.table.completionRate")}</th>
              <th style={{ textAlign: "center" }}>{t("tenants.statistics.table.new_customers")}</th>
              <th style={{ textAlign: "center" }}>{t("tenants.statistics.table.reservations")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedTenants.map((tenant, i) => {
              const rowSnapshot = tenantSnapshotMap.get(tenant.id);
              return (
                <tr
                  key={tenant.id}
                  id={`row-${tenant.id}`}
                  onClick={() => selectTenant(tenant.id)}
                  className={openTenantId === tenant.id ? "active-row" : ""}
                >
                  <td>
                    <span style={{ fontSize: "0.875rem", fontFamily: "DM Mono, monospace", color: i < 3 ? "var(--primary)" : "var(--text-muted)" }}>
                      #{i + 1}
                    </span>
                  </td>
                  <td>
                    <div className="stats-t-info">
                      <div className="stats-t-avatar" style={{ background: rowSnapshot ? "var(--primary)" : "#999" }}>
                        {tenant.name[0]}
                      </div>
                      <div>
                        <div className="stats-t-name">{tenant.name}</div>
                        <div className="stats-t-domain">{tenant.businessName || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {tenant.hostName || "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="stats-t-revenue">
                      {rowSnapshot ? formatVND(rowSnapshot.revenue) : "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "DM Mono, monospace", fontSize: "0.9375rem" }}>
                    {rowSnapshot?.totalOrders ?? "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className="stats-t-rate"
                      style={{
                        color: rowSnapshot?.totalOrders ? "var(--success)" : "var(--text-muted)",
                      }}
                    >
                      {rowSnapshot ? formatCompletionRate(rowSnapshot.completedOrders, rowSnapshot.totalOrders) : "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "DM Mono, monospace", fontSize: "0.9375rem" }}>
                    {rowSnapshot?.newCustomers ?? "—"}
                  </td>
                  <td style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "DM Mono, monospace", fontSize: "0.9375rem" }}>
                    {rowSnapshot?.newReservations ?? "—"}
                  </td>
                  <td>
                    <button
                      className={`stats-btn-detail ${openTenantId === tenant.id ? "on" : ""}`}
                      id={`dbt-${tenant.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectTenant(tenant.id);
                      }}
                    >
                      <EyeOutlined />
                      {t("tenants.statistics.table.details")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      <div ref={detailPanelRef} className={`stats-detail-panel ${openTenantId ? "open" : ""}`} id="detail-panel">
        <div className="stats-detail-panel-head">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="stats-detail-panel-title">
              <div
                className="stats-t-avatar"
                style={{ width: "28px", height: "28px", fontSize: "12px", borderRadius: "6px", background: "var(--primary)" }}
              >
                {selectedTenant?.name?.[0] || "?"}
              </div>
              <span>{selectedTenant?.name || "—"}</span>
            </div>
            <button className="stats-btn-close-panel" onClick={closeDetail}>
              ✕
            </button>
          </div>
          <div className="stats-period-tabs" style={{ justifyContent: "flex-end", width: "fit-content" }}>
            {(["daily", "monthly", "yearly"] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`stats-period-tab ${snapshotState.periodType === p ? "active" : ""}`}
                disabled={snapshotState.loading}
              >
                {t(`strategyReport.period.${p}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="stats-detail-kpi-row">
          <div className="stats-detail-kpi">
            <div className="stats-detail-kpi-label">{t("strategyReport.kpi.totalRevenue")}</div>
            <div className="stats-detail-kpi-value primary">
              {formatVND(detailRevenue)}
            </div>
          </div>
          <div className="stats-detail-kpi">
            <div className="stats-detail-kpi-label">{t("tenants.statistics.table.orders")}</div>
            <div className="stats-detail-kpi-value">
              {detailTotalOrders}
            </div>
          </div>
          <div className="stats-detail-kpi">
            <div className="stats-detail-kpi-label">{t("strategyReport.kpi.completionRate")}</div>
            <div className="stats-detail-kpi-value success">
              {formatCompletionRate(detailCompletedOrders, detailTotalOrders)}
            </div>
          </div>
          <div className="stats-detail-kpi">
            <div className="stats-detail-kpi-label">{t("strategyReport.kpi.cancellationRate")}</div>
            <div className="stats-detail-kpi-value danger">
              {detailCancelledOrders} đơn
            </div>
          </div>
          <div className="stats-detail-kpi">
            <div className="stats-detail-kpi-label">{t("tenants.statistics.table.reservations")}</div>
            <div className="stats-detail-kpi-value purple">
              {detailNewReservations}
            </div>
          </div>
        </div>
        <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
          {snapshotState.loading && !selectedDetail ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <Spin size="large" />
            </div>
          ) : snapshotState.periodType === "daily" ? (
            <div className="ts-daily-summary-info" style={{ 
              padding: "1.5rem",
              backgroundColor: "rgba(var(--primary-rgb, 59, 130, 246), 0.05)",
              border: "1px solid rgba(var(--primary-rgb, 59, 130, 246), 0.2)",
              borderRadius: "0.5rem",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.9375rem", fontWeight: "500", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                {t("strategyReport.dailySummaryTitle", "Tổng quan ngày hôm qua")}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                {t("strategyReport.dailySummaryDesc", "Báo cáo hôm qua chỉ cung cấp tổng quan dữ liệu (ở trên). Hãy chọn 'Tháng' hoặc 'Năm' để xem biểu đồ chi tiết")}
              </div>
            </div>
          ) : selectedDetail?.breakdown?.length ? (
            <BreakdownCharts breakdown={selectedDetail.breakdown} periodType={snapshotState.periodType} />
          ) : (
            <div className="ts-no-data" style={{ padding: "1rem" }}>
              {t("strategyReport.noTenantData")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantStatisticsTab;