"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CategorySettings from "../settings/components/CategorySettings";
import SupplierSettings from "../settings/components/SupplierSettings";
import IngredientCategorySettings from "../settings/components/IngredientCategorySettings";

export default function ManagePage() {
    const { t } = useTranslation("common");
    const [activeTab, setActiveTab] = useState<"categories" | "suppliers" | "ingredientCategories">("categories");

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
                <div className="flex gap-2 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                    {[
                        {
                            id: "categories" as const,
                            label: t("dashboard.manage.tabs.categories"),
                            icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
                        },
                        {
                            id: "ingredientCategories" as const,
                            label: t("dashboard.manage.tabs.ingredient_categories", { defaultValue: "Ingredient Categories" }),
                            icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
                        },
                        {
                            id: "suppliers" as const,
                            label: t("dashboard.manage.tabs.suppliers", { defaultValue: "Suppliers" }),
                            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
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

                {/* Ingredient Categories Tab */}
                {activeTab === "ingredientCategories" && (
                    <IngredientCategorySettings />
                )}

                {/* Suppliers Tab */}
                {activeTab === "suppliers" && (
                    <SupplierSettings />
                )}
            </div>
        </main>
    );
}

