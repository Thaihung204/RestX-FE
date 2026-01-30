"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Header spans the full width */}
      <DashboardHeader />

      {/* Container for Sidebar and Main Content */}
      <div className="flex flex-1">
        {/* Sidebar takes its defined width and sits below header */}
        <DashboardSidebar />

        {/* Main Content Area */}
        {/* We use 'relative' to establish a positioning context if needed */}
        <div className="flex-1 relative">
          {children}
        </div>
      </div>
    </div>
  );
}
