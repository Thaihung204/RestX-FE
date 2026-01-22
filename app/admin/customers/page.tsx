"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import CustomerList from "@/components/admin/customers/CustomerList";

export default function CustomersPage() {
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
              Quản lý Khách hàng
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              Xem và quản lý thông tin khách hàng của nhà hàng
            </p>
          </div>

          <CustomerList />
        </main>
      </div>
    </div>
  );
}
