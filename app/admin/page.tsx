"use client";

import ActivityTimeline from "@/components/admin/ActivityTimeline";
import AreaDistributionChart from "@/components/admin/charts/AreaDistributionChart";
import OrdersBarChart from "@/components/admin/charts/OrdersBarChart";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import KPISection from "@/components/admin/KPISection";
import QuickActions from "@/components/admin/QuickActions";
import TableStatusMap from "@/components/admin/TableStatusMap";
import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function DashboardPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <DashboardSidebar />

      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        <main
          className="flex-1 p-6 lg:p-8 overflow-y-auto"
          style={{ background: "var(--bg-base)", color: "var(--text)" }}>
          <div className="space-y-6">
            <section>
              <KPISection />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart />
              <OrdersBarChart />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <AreaDistributionChart />
              </div>
              <div className="lg:col-span-2">
                <QuickActions />
              </div>
            </section>

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
