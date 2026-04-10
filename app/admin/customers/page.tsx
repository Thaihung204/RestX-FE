"use client";

import CustomerList, {
  CustomerListHandle,
} from "@/components/admin/customers/CustomerList";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function CustomersPage() {
  const { t } = useTranslation("common");
  const customerListRef = useRef<CustomerListHandle | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleRefresh = async () => {
    if (!customerListRef.current) return;
    setRefreshing(true);
    try {
      await customerListRef.current.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!customerListRef.current) return;
    setExporting(true);
    try {
      await customerListRef.current.exportExcel();
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2
              className="text-3xl font-bold mb-1"
              style={{ color: "var(--text)" }}>
              {t("customers.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("customers.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: "var(--primary-soft)",
                border: "1px solid var(--primary-border)",
                color: "var(--primary)",
              }}>
              <DownloadOutlined />
              {exporting
                ? t("common.actions.exporting_report")
                : t("dashboard.actions.export_report")}
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}>
              <ReloadOutlined />
              {refreshing
                ? t("common.actions.loading", { defaultValue: "Đang tải..." })
                : t("admin.reservations.refresh", { defaultValue: "Làm mới" })}
            </button>
          </div>
        </div>

        <div
          className="rounded-xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          <CustomerList ref={customerListRef} />
        </div>
      </div>
    </main>
  );
}
