"use client";

import IngredientList from "@/components/admin/ingredients/IngredientList";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function IngredientsPage() {
  const { t } = useTranslation("common");
  const router = useRouter();

  return (
    <main
      className="flex-1 p-6 lg:p-8"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
            {t("dashboard.ingredients.title", "Nguyên liệu")}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            {t("dashboard.ingredients.subtitle", "Quản lý danh sách nguyên liệu, thêm mới, chỉnh sửa, xoá.")}
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/ingredients/new")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-all"
          style={{ background: "#FF380B" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#CC2D08")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FF380B")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("dashboard.ingredients.add_ingredient", "Thêm nguyên liệu")}
        </button>
      </div>

      <IngredientList />
    </main>
  );
}
