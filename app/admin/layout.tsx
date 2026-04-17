"use client";

import AdminAuthGuard from "@/components/auth/AdminAuthGuard";
import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

        <DashboardHeader />

        <div className="flex flex-1 overflow-hidden">

          <DashboardSidebar />

          <div className="admin-layout-content flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </AdminAuthGuard>
  );
}

