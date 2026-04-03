"use client";

import CustomerList from "@/components/admin/customers/CustomerList";
import { useTranslation } from "react-i18next";

export default function CustomersPage() {
  const { t } = useTranslation('common');

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
              {t('customers.title')}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t('customers.subtitle')}
            </p>
          </div>
        </div>

        <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <CustomerList />
        </div>
      </div>
    </main>
  );
}
