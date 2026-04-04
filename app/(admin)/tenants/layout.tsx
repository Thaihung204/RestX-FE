"use client";

import React from "react";
import TenantDashboardHeader from "../../../components/(admin)/tenants/TenantDashboardHeader";
import { TenantLayoutProvider, useTenantLayout } from "./TenantLayoutProvider";

const HeaderWrapper = () => {
  const { tabItems, activeTab, setActiveTab } = useTenantLayout();
  return (
    <TenantDashboardHeader
      items={tabItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export default function TenantsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantLayoutProvider>
      <div className="min-h-screen font-sans" style={{ background: "var(--bg-base)", color: "var(--text)" }}>
        <HeaderWrapper />
        {children}
      </div>
    </TenantLayoutProvider>
  );
}
