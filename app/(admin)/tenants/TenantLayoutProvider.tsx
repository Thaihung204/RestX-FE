"use client";

import React, { createContext, useContext, useState } from "react";
import type { TenantDashboardTabItem } from "../../../components/(admin)/tenants/TenantDashboardHeader";

type TenantLayoutContextType = {
  tabItems: TenantDashboardTabItem[];
  setTabItems: React.Dispatch<React.SetStateAction<TenantDashboardTabItem[]>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
};

const TenantLayoutContext = createContext<TenantLayoutContextType | null>(null);

export const useTenantLayout = () => {
  const context = useContext(TenantLayoutContext);
  if (!context) {
    throw new Error("useTenantLayout must be used within TenantLayoutProvider");
  }
  return context;
};

export const TenantLayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [tabItems, setTabItems] = useState<TenantDashboardTabItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");

  return (
    <TenantLayoutContext.Provider value={{ tabItems, setTabItems, activeTab, setActiveTab }}>
      {children}
    </TenantLayoutContext.Provider>
  );
};
