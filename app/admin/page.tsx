"use client";

import AreaDistributionChart from "@/components/admin/charts/AreaDistributionChart";
import OrdersBarChart from "@/components/admin/charts/OrdersBarChart";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import KPISection from "@/components/admin/KPISection";
import QuickActions from "@/components/admin/QuickActions";
import TableStatusMap from "@/components/admin/TableStatusMap";
export default function DashboardPage() {
  return (
    <main
      className="flex-1 p-6 lg:p-8"
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
          <div className="lg:col-span-3">
            <TableStatusMap />
          </div>
        </section>
      </div>
    </main>
  );
}
