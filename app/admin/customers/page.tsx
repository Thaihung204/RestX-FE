"use client";

import CustomerList from "@/components/admin/customers/CustomerList";
import { useTranslation } from "react-i18next";

export default function CustomersPage() {
  const { t } = useTranslation('common');
  
  return (
    <main
      className="flex-1 p-6 lg:p-8"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          {t('customers.title')}
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          {t('customers.subtitle')}
        </p>
      </div>

      <CustomerList />
    </main>
  );
}
