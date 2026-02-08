"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CategorySettings from "../settings/components/CategorySettings";
import SupplierSettings from "../settings/components/SupplierSettings";
import IngredientCategorySettings from "../settings/components/IngredientCategorySettings";
import LoyaltyPointBandSettings from "../settings/components/LoyaltyPointBandSettings";

export default function ManagePage() {
    const { t } = useTranslation("common");
    const [activeTab, setActiveTab] = useState<"categories" | "suppliers" | "ingredientCategories" | "loyalty">("categories");

    return (
        <main className="p-6 lg:p-8">
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                        {t("dashboard.manage.title")}
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.manage.subtitle")}
                    </p>
                </div>

                {/* Modern Pill Tabs */}
                <div
                    className="flex p-1 rounded-xl backdrop-blur w-fit"
                    style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)'
                    }}
                >
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
                        {
                            id: "loyalty" as const,
                            label: t("dashboard.manage.tabs.loyalty", { defaultValue: "Loyalty Bands" }),
                            icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="relative px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 hover:opacity-80"
                            style={{
                                background: activeTab === tab.id ? 'var(--bg-base)' : 'transparent',
                                color: activeTab === tab.id ? '#FF380B' : 'var(--text-muted)',
                                boxShadow: activeTab === tab.id ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                                border: activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent'
                            }}
                            suppressHydrationWarning
                        >
                            <svg
                                className={`w-4 h-4 ${activeTab === tab.id ? 'stroke-2' : 'stroke-[1.5]'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
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

                {/* Loyalty Bands Tab */}
                {activeTab === "loyalty" && (
                    <LoyaltyPointBandSettings />
                )}
            </div>
        </main>
    );
}

