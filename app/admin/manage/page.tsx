"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CategorySettings from "../settings/components/CategorySettings";

export default function ManagePage() {
    const { t } = useTranslation("common");
    const [activeTab, setActiveTab] = useState<"categories">("categories");

    return (
        <main className="p-6 lg:p-8">
            <div className="space-y-6 max-w-5xl">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                        {t("dashboard.manage.title")}
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.manage.subtitle")}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    {[
                        {
                            id: "categories" as const,
                            label: t("dashboard.manage.tabs.categories"),
                            icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="px-4 py-3 font-medium transition-all flex items-center gap-2"
                            style={{
                                color: activeTab === tab.id ? '#FF380B' : 'var(--text-muted)',
                                borderBottom: activeTab === tab.id ? '2px solid #FF380B' : 'none',
                            }}
                            suppressHydrationWarning>
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={tab.icon}
                                />
                            </svg>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Categories Tab */}
                {activeTab === "categories" && (
                    <CategorySettings />
                )}
            </div>
        </main>
    );
}
