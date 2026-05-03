"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Table, Spin, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BarChartOutlined,
  EyeOutlined,
  RiseOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { ITenant } from "@/lib/types/tenant";
import { useSnapshotData } from "@/app/lib/hooks/useSnapshotData";
import { KpiCards } from "@/app/components/admin/strategy-report/KpiCards";
import { BreakdownCharts } from "@/app/components/admin/strategy-report/BreakdownCharts";
import { PeriodType } from "@/app/lib/types/snapshot.types";
import { formatVND, formatCompletionRate } from "@/app/lib/utils/snapshot-formatters";

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
    resetToAllTenants,
    changePeriod,
  } = useSnapshotData();

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch snapshot data on mount
  useEffect(() => {
    fetchAllTenants("monthly");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((tenant) => tenant.status === "active").length;
    const maintenance = tenants.filter((tenant) => tenant.status === "maintenance").length;
    const recent = tenants.filter((tenant) => getActivityBand(tenant.lastActive) === "fresh").length;
    return { total, active, maintenance, recent };
  }, [tenants]);

  // Look up snapshot revenue for a tenant by id
  const getSnapshotForTenant = (tenantId: string) => {
    return snapshotState.allTenantsData?.tenants.find(
      (s) => s.tenantId === tenantId
    );
  };

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === selectedTenantId),
    [tenants, selectedTenantId]
  );

  const handleViewRevenue = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setModalOpen(true);
    fetchTenantDetail(tenantId, snapshotState.periodType);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTenantId(null);
    resetToAllTenants();
  };

  const handlePeriodChange = (period: PeriodType) => {
    changePeriod(period);
  };

  const columns: ColumnsType<ITenant> = [
    {
      title: t("tenants.statistics.table.restaurant"),
      key: "restaurant",
      render: (_, record) => (
        <div className="tenant-stat-restaurant">
          <div className="tenant-stat-restaurant-avatar">
            {record.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="tenant-stat-restaurant-name">{record.name}</div>
            <div className="tenant-stat-restaurant-business">{record.businessName}</div>
          </div>
        </div>
      ),
    },
    {
      title: t("tenants.statistics.table.plan"),
      dataIndex: "plan",
      key: "plan",
      render: (plan: ITenant["plan"]) => (
        <span className={`tenant-stat-plan tenant-stat-plan-${plan}`}>{t(`tenants.plan.${plan}`)}</span>
      ),
    },
    {
      title: t("tenants.statistics.table.status"),
      dataIndex: "status",
      key: "status",
      render: (status: ITenant["status"]) => (
        <span className={`tenant-status-label tenant-status-label-${status}`}>{t(`tenants.status.${status}`)}</span>
      ),
    },
    {
      title: t("strategyReport.table.revenue"),
      key: "revenue",
      sorter: (a, b) => {
        const snapA = getSnapshotForTenant(a.id);
        const snapB = getSnapshotForTenant(b.id);
        return (snapA?.revenue ?? 0) - (snapB?.revenue ?? 0);
      },
      render: (_, record) => {
        const snap = getSnapshotForTenant(record.id);
        if (!snap) return <span className="ts-no-data">{"\u2014"}</span>;
        return (
          <span className="ts-revenue-value">
            {formatVND(snap.revenue)}
          </span>
        );
      },
    },
    {
      title: t("strategyReport.table.completionRate"),
      key: "completionRate",
      render: (_, record) => {
        const snap = getSnapshotForTenant(record.id);
        if (!snap) return <span className="ts-no-data">{"\u2014"}</span>;
        return (
          <span className="ts-completion-value">
            {formatCompletionRate(snap.completedOrders, snap.totalOrders)}
          </span>
        );
      },
    },
    {
      title: t("tenants.statistics.table.last_active"),
      dataIndex: "lastActive",
      key: "lastActive",
      render: (lastActive: string) => {
        const band = getActivityBand(lastActive);
        return (
          <div className={`tenant-stat-activity tenant-stat-activity-${band}`}>
            <span>{formatLastActive(lastActive)}</span>
            <small>{t(`tenants.statistics.activity.${band}`)}</small>
          </div>
        );
      },
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      width: 200,
      render: (_, record) => (
        <div className="ts-actions-cell">
          <Button
            type="text"
            icon={<BarChartOutlined />}
            className="ts-revenue-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRevenue(record.id);
            }}
          >
            {t("strategyReport.viewRevenue")}
          </Button>
          <Button
            type="text"
            icon={<EyeOutlined />}
            className="tenant-stat-view-btn"
            onClick={() => onViewDetails(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Hero Section */}
      <div className="tenant-statistics-hero tenant-glass">
        <div>
          <p className="tenant-statistics-kicker">{t("tenants.statistics.kicker")}</p>
          <h2 className="tenant-statistics-title">{t("tenants.statistics.title")}</h2>
          <p className="tenant-statistics-subtitle">{t("tenants.statistics.subtitle")}</p>
        </div>
        <div className="tenant-statistics-meta">
          <div>
            <ShopOutlined />
            <span>{t("tenants.statistics.total_restaurants", { count: summary.total })}</span>
          </div>
          <div>
            <UserOutlined />
            <span>{t("tenants.statistics.active_restaurants", { count: summary.active })}</span>
          </div>
        </div>
      </div>

      {/* Status KPI Cards */}
      <div className="tenant-stats-bar">
        <div className="tenant-stat-card">
          <div className="tenant-stat-glow" style={{ background: "rgba(35, 146, 255, 0.1)" }} />
          <div className="tenant-stat-top">
            <div>
              <p className="tenant-stat-label">{t("tenants.statistics.cards.total")}</p>
              <h3 className="tenant-stat-value">{summary.total}</h3>
            </div>
            <span className="tenant-stat-icon" style={{ color: "#5aa7ff" }}>
              <ShopOutlined />
            </span>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-glow" style={{ background: "rgba(34, 197, 94, 0.1)" }} />
          <div className="tenant-stat-top">
            <div>
              <p className="tenant-stat-label">{t("tenants.statistics.cards.active")}</p>
              <h3 className="tenant-stat-value">{summary.active}</h3>
            </div>
            <span className="tenant-stat-icon" style={{ color: "#22C55E" }}>
              <RiseOutlined />
            </span>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-glow" style={{ background: "rgba(249, 115, 22, 0.1)" }} />
          <div className="tenant-stat-top">
            <div>
              <p className="tenant-stat-label">{t("tenants.statistics.cards.maintenance")}</p>
              <h3 className="tenant-stat-value">{summary.maintenance}</h3>
            </div>
            <span className="tenant-stat-icon" style={{ color: "#F97316" }}>
              <UserOutlined />
            </span>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-glow" style={{ background: "rgba(168, 85, 247, 0.1)" }} />
          <div className="tenant-stat-top">
            <div>
              <p className="tenant-stat-label">{t("tenants.statistics.cards.recent")}</p>
              <h3 className="tenant-stat-value">{summary.recent}</h3>
            </div>
            <span className="tenant-stat-icon" style={{ color: "#A855F7" }}>
              <RiseOutlined />
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Overview Section */}
      <div className="ts-revenue-section">
        <div className="ts-revenue-header">
          <h3 className="ts-revenue-section-title">
            {t("strategyReport.revenueOverview")}
          </h3>
          <div className="ts-period-selector">
            {(["weekly", "monthly"] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`ts-period-btn ${snapshotState.periodType === p ? "ts-period-btn-active" : ""}`}
                disabled={snapshotState.loading}
              >
                {t(`strategyReport.period.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue KPI Cards */}
        {snapshotState.loading && !snapshotState.allTenantsData ? (
          <div className="ts-loading-container">
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
          <div className="ts-error-message">
            {snapshotState.error}
          </div>
        ) : null}
      </div>

      {/* Tenant Table */}
      <div className="tenant-statistics-table-wrap tenant-table-wrap">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tenants}
          size="small"
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showTotal: (total) => (
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                {t("tenants.statistics.table.total", { count: total })}
              </span>
            ),
            className: "px-4 pb-3",
            responsive: true,
            showLessItems: true,
          }}
          scroll={{ x: "max-content" }}
        />
      </div>

      {/* Revenue Breakdown Modal */}
      <Modal
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={960}
        centered
        destroyOnClose
        className="ts-breakdown-modal"
        title={
          <div className="ts-modal-header">
            <div className="ts-modal-avatar">
              {selectedTenant?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <h3 className="ts-modal-title">
                {selectedTenant?.name ?? selectedTenantId}
              </h3>
              <p className="ts-modal-subtitle">
                {t("strategyReport.revenueBreakdown")}
              </p>
            </div>
          </div>
        }
      >
        <div className="ts-modal-body">
          {snapshotState.loading && (
            <div className="ts-loading-container">
              <Spin size="large" />
            </div>
          )}

          {!snapshotState.loading && snapshotState.tenantDetailData && (
            <BreakdownCharts breakdown={snapshotState.tenantDetailData.breakdown} />
          )}

          {!snapshotState.loading && !snapshotState.tenantDetailData && snapshotState.error && (
            <div className="ts-error-message">
              {snapshotState.error}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TenantStatisticsTab;