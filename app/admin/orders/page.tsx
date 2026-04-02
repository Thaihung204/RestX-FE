"use client";

import OrderList from "@/components/admin/orders/OrderList";
import { useTranslation } from "react-i18next";

export default function OrdersPage() {
  const { t } = useTranslation("common");

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
              {t("dashboard.orders.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.orders.subtitle")}
            </p>
          </div>
        </div>

        <OrderList />
      </div>
    </main>
  );
}
