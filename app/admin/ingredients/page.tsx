"use client";

import IngredientList from "@/components/admin/ingredients/IngredientList";
import Link from "next/link";
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

        <Link href="/admin/ingredients/new">
              <button
                className="px-4 py-2 text-white rounded-lg font-medium transition-all"
                style={{ background: "var(--primary)", color: "var(--text)" }}
                onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "linear-gradient(to right, #CC2D08, #B32607)")
                }
                onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  "linear-gradient(to right, var(--primary), #CC2D08)")
                }
                suppressHydrationWarning> 
                <svg
                className="w-5 h-5 inline-block mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
                {t("dashboard.ingredients.add_ingredient")}
              </button>
            </Link>
      </div>

      <IngredientList />
    </main>
  );
}
