"use client";

import IngredientList from "@/components/admin/ingredients/IngredientList";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function IngredientsPage() {
  const { t } = useTranslation("common");

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
            <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
            {t("dashboard.ingredients.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
            {t("dashboard.ingredients.subtitle")}
          </p>
        </div>

          <Link
            href="/admin/ingredients/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
                {t("dashboard.ingredients.add_ingredient")}
            </Link>
      </div>

        <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <IngredientList />
        </div>
      </div>
    </main>
  );
}
