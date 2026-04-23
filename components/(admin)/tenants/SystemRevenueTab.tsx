"use client";

import React, { useState } from "react";
import { DatePicker } from "antd";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import { useTranslation } from "react-i18next";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
} from "@ant-design/icons";

const SystemRevenueTab: React.FC = () => {
  const { t } = useTranslation();
  const [activeRevenueRange, setActiveRevenueRange] = useState<
    "day" | "week" | "month" | "year"
  >("month");

  const rangeOptions = [
    { label: t("tenants.revenue.day"), value: "day" as const },
    { label: t("tenants.revenue.week"), value: "week" as const },
    { label: t("tenants.revenue.month"), value: "month" as const },
    { label: t("tenants.revenue.year"), value: "year" as const },
  ];

  return (
    <div className="sr-shell">
      {/* ── Header Bar ── */}
      <div className="sr-header-bar">
        <div className="sr-header-text">
          <h2 className="sr-header-title">{t("tenants.revenue.title")}</h2>
          <p className="sr-header-subtitle">{t("tenants.revenue.subtitle")}</p>
        </div>
        <div className="sr-header-controls">
          <div className="sr-range-group">
            {rangeOptions.map((opt) => (
              <button
                key={opt.value}
                className={`sr-range-btn ${activeRevenueRange === opt.value ? "sr-range-btn-active" : ""}`}
                onClick={() => setActiveRevenueRange(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          <DatePicker.RangePicker
            className="sr-date-picker"
            classNames={{ popup: { root: "sr-date-popup" } }}
          />
        </div>
      </div>

      {/* ── KPI Summary Row ── */}
      <div className="sr-kpi-row">
        <div className="sr-kpi-card">
          <div className="sr-kpi-accent" />
          <div className="sr-kpi-icon-wrap">
            <DollarOutlined />
          </div>
          <div className="sr-kpi-content">
            <span className="sr-kpi-value">0d</span>
            <span className="sr-kpi-label">{t("tenants.revenue.total_revenue")}</span>
          </div>
          <div className="sr-kpi-trend sr-kpi-trend-neutral">
            <RiseOutlined />
            <span>0%</span>
          </div>
        </div>

        <div className="sr-kpi-card">
          <div className="sr-kpi-accent" />
          <div className="sr-kpi-icon-wrap">
            <ShoppingCartOutlined />
          </div>
          <div className="sr-kpi-content">
            <span className="sr-kpi-value">0</span>
            <span className="sr-kpi-label">{t("tenants.revenue.orders_period")}</span>
          </div>
          <div className="sr-kpi-trend sr-kpi-trend-neutral">
            <RiseOutlined />
            <span>0%</span>
          </div>
        </div>

        <div className="sr-kpi-card">
          <div className="sr-kpi-accent" />
          <div className="sr-kpi-icon-wrap">
            <DollarOutlined />
          </div>
          <div className="sr-kpi-content">
            <span className="sr-kpi-value">0d</span>
            <span className="sr-kpi-label">{t("tenants.revenue.avg_order_value")}</span>
          </div>
          <div className="sr-kpi-trend sr-kpi-trend-neutral">
            <RiseOutlined />
            <span>0%</span>
          </div>
        </div>
      </div>

      {/* ── Revenue Chart ── */}
      <div className="sr-chart-wrap">
        <RevenueChart />
      </div>
    </div>
  );
};

export default SystemRevenueTab;
