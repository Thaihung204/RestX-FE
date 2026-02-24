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
      {/* Fixed-height layout: body/html không scroll. Content scroll bên trong main */}
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
        {/* Header spans the full width */}
        <DashboardHeader />

        {/* Container for Sidebar and Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar takes its defined width and sits below header */}
          <DashboardSidebar />

          {/* Main Content Area — scroll happens HERE, not in body */}
          <div className="flex-1 overflow-y-auto relative">
            {children}
          </div>
        </div>
      </div>
    </AdminAuthGuard>
  );
}

