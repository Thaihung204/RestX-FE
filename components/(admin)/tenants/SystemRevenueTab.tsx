"use client";

import React, { useState } from "react";
import { Card, DatePicker, Radio, Typography } from "antd";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import { useTranslation } from "react-i18next";

const SystemRevenueTab: React.FC = () => {
  const { t } = useTranslation();
  const [activeRevenueRange, setActiveRevenueRange] = useState<
    "day" | "week" | "month" | "year"
  >("month");

  return (
    <div className="space-y-4">
      <Card
        variant="borderless"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                color: "var(--text)",
              }}>
              {t("tenants.revenue.title")}
            </Typography.Title>
            <Typography.Text style={{ color: "var(--text-muted)" }}>
              {t("tenants.revenue.subtitle")}
            </Typography.Text>
          </div>
          <div className="flex flex-wrap gap-3">
            <Radio.Group
              value={activeRevenueRange}
              onChange={(e) => setActiveRevenueRange(e.target.value)}
              options={[
                { label: t("tenants.revenue.day"), value: "day" },
                { label: t("tenants.revenue.week"), value: "week" },
                { label: t("tenants.revenue.month"), value: "month" },
                { label: t("tenants.revenue.year"), value: "year" },
              ]}
              optionType="button"
              buttonStyle="solid"
            />
            <DatePicker.RangePicker />
          </div>
        </div>
      </Card>

      <RevenueChart />
    </div>
  );
};

export default SystemRevenueTab;
