"use client";

import {
  CheckCircleOutlined,
  RiseOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TenantsSystemRevenue from "../../../components/(admin)/tenants/SystemRevenueTab";
import type { TenantDashboardTabItem } from "../../../components/(admin)/tenants/TenantDashboardHeader";
import TenantDashboardHeader from "../../../components/(admin)/tenants/TenantDashboardHeader";
import TenantList from "../../../components/(admin)/tenants/TenantList";
import TenantRequestList from "../../../components/(admin)/tenants/TenantRequestList";

const TenantPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("tenants");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const TAB_ITEMS: TenantDashboardTabItem[] = [
    {
      key: "tenants",
      label: t("tenants.tabs.restaurant_list"),
      icon: <ShopOutlined />,
    },
    {
      key: "requests",
      label: t("tenants.tabs.tenant_requests"),
      icon: <CheckCircleOutlined />,
    },
    {
      key: "revenue",
      label: t("tenants.tabs.system_revenue"),
      icon: <RiseOutlined />,
    },
  ];

  if (!mounted) {
    return <div className="min-h-screen" style={{ background: "var(--bg-base)" }} />;
  }

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <TenantDashboardHeader
        items={TAB_ITEMS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main
        className="px-6 lg:px-8 py-8"
        style={{ background: "var(--bg-base)", color: "var(--text)" }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === "tenants" && <TenantList />}
          {activeTab === "requests" && <TenantRequestList />}
          {activeTab === "revenue" && <TenantsSystemRevenue />}
        </div>
      </main>
    </div>
  );
};

export default TenantPage;
