"use client";

import CustomerList from "@/components/admin/customers/CustomerList";

export default function CustomersPage() {
  return (
    <main
      className="flex-1 p-6 lg:p-8"
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
  );
}
