"use client";

import { useTranslation } from "react-i18next";
import { formatVND } from "@/lib/utils/currency";

interface TopDish {
  dishId: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface BestSellingDishesCardProps {
  dishes?: TopDish[];
  loading?: boolean;
}

export default function BestSellingDishesCard({
  dishes = [],
  loading = false,
}: BestSellingDishesCardProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        className="rounded-lg p-5 border"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>
          {t("dashboard.best_selling_dishes.title")}
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg p-3"
              style={{ background: "var(--surface)" }}>
              <div
                className="h-4 rounded mb-2"
                style={{ background: "var(--border)", width: "70%" }}
              />
              <div
                className="h-2 rounded"
                style={{ background: "var(--border)", width: "100%" }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dishes || dishes.length === 0) {
    return (
      <div
        className="rounded-lg p-5 border"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>
          {t("dashboard.best_selling_dishes.title")}
        </h3>
        <div
          className="text-center py-8 rounded-lg"
          style={{ background: "var(--surface)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.best_selling_dishes.empty")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-5 border"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
          {t("dashboard.best_selling_dishes.title")}
        </h3>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            background: "var(--surface)",
            color: "var(--text-muted)",
          }}>
          {t("dashboard.best_selling_dishes.subtitle", { count: dishes.length })}
        </span>
      </div>

      <div className="space-y-3">
        {dishes.map((dish, index) => {
          const rank = index + 1;
          
          // Format currency
          const formattedRevenue = formatVND(dish.revenue);

          return (
            <div
              key={dish.dishId}
              className="rounded-lg p-3 border"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}>
              <div className="flex items-start gap-2.5">
                <span
                  className="text-xs font-semibold flex-shrink-0 w-6 text-center mt-0.5"
                  style={{ color: "var(--text-muted)" }}>
                  #{rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium mb-1.5"
                    style={{ color: "var(--text)" }}>
                    {dish.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.best_selling_dishes.sold")}: <span className="font-medium" style={{ color: "var(--text)" }}>{dish.quantity}</span>
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>•</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.best_selling_dishes.revenue")}: <span className="font-medium" style={{ color: "var(--primary)" }}>{formattedRevenue}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
