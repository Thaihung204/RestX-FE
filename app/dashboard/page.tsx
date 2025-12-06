"use client";

import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import AreaDistributionChart from "@/components/dashboard/charts/AreaDistributionChart";
import OrdersBarChart from "@/components/dashboard/charts/OrdersBarChart";
import RevenueChart from "@/components/dashboard/charts/RevenueChart";
import KPISection from "@/components/dashboard/KPISection";
import QuickActions from "@/components/dashboard/QuickActions";
import TableStatusMap from "@/components/dashboard/TableStatusMap";
import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* KPI Cards */}
            <section>
              <KPISection />
            </section>

            {/* Charts Row */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart />
              <OrdersBarChart />
            </section>

            {/* Area Distribution & Quick Actions */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <AreaDistributionChart />
              </div>
              <div className="lg:col-span-2">
                <QuickActions />
              </div>
            </section>

            {/* Table Status & Activity Timeline */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TableStatusMap />
              </div>
              <div className="lg:col-span-1">
                <ActivityTimeline />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
