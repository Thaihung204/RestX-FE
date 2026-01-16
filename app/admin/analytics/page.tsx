"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useTranslation } from "react-i18next";

export default function AnalyticsPage() {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* Page Header */}
            <div
              className="rounded-2xl p-6 shadow-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,122,0,0.18) 0%, rgba(255,122,0,0.08) 100%), var(--card)",
                border: "1px solid rgba(255,122,0,0.22)",
              }}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
                {t("dashboard.analytics.title")}
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.analytics.subtitle")}
              </p>
            </div>

            {/* Coming Soon */}
            <div
              className="rounded-xl p-12 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(255,122,0,0.12)" }}>
                <svg
                  className="w-10 h-10"
                  style={{ color: "#FF7A00" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
                {t("dashboard.analytics.page_title")}
              </h3>
              <p className="mb-4" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.analytics.coming_soon")}
              </p>
              <div className="inline-flex items-center gap-2 text-sm" style={{ color: "#FF7A00" }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#FF7A00" }}></div>
                {t("dashboard.analytics.under_development")}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
