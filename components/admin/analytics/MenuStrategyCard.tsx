"use client";

import React from "react";
import { formatVND } from "@/lib/utils/currency";

interface MenuStrategyCardProps {
  menuStrategy: {
    trendingDish?: {
      dishName: string;
      whyTrending: string;
      action: string;
    };
    timeBasedDishes?: Array<{
      context: string;
      dishName: string;
      reason: string;
    }>;
    suggestedAdditions?: Array<{
      dishName: string;
      reason: string;
      action: string;
    }>;
    comboSuggestions?: Array<{
      dishes: string[];
      suggestedPrice: number;
      aovIncrease: number;
      reason: string;
    }>;
  };
}

import { useTranslation } from "react-i18next";

export default function MenuStrategyCard({ menuStrategy }: MenuStrategyCardProps) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      {/* Trending Dish */}
      {menuStrategy.trendingDish && (
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--primary)",
          }}>
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5"
              style={{ color: "var(--primary)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <h5 className="font-bold" style={{ color: "var(--text)" }}>
              {t('dashboard.analytics.menu.trendingDish')} {menuStrategy.trendingDish.dishName}
            </h5>
          </div>
          <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
            {menuStrategy.trendingDish.whyTrending}
          </p>
          <div
            className="text-sm font-medium px-3 py-2 rounded"
            style={{
              background: "var(--primary-soft)",
              color: "var(--primary)",
            }}>
            → {menuStrategy.trendingDish.action}
          </div>
        </div>
      )}

      {/* Time Based Dishes */}
      {menuStrategy.timeBasedDishes && menuStrategy.timeBasedDishes.length > 0 && (
        <div>
          <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>
            {t('dashboard.analytics.menu.timeBasedDishes')}
          </h5>
          <div className="space-y-2">
            {menuStrategy.timeBasedDishes.map((dish, index) => (
              <div
                key={index}
                className="rounded-lg p-3"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {dish.context}
                  </span>
                </div>
                <p className="font-medium text-sm mb-1" style={{ color: "var(--text)" }}>
                  {dish.dishName}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {dish.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Additions */}
      {menuStrategy.suggestedAdditions && menuStrategy.suggestedAdditions.length > 0 && (
        <div>
          <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>
            {t('dashboard.analytics.menu.suggestedAdditions')}
          </h5>
          <div className="space-y-2">
            {menuStrategy.suggestedAdditions.map((addition, index) => (
              <div
                key={index}
                className="rounded-lg p-3"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                <p className="font-medium text-sm mb-1" style={{ color: "var(--text)" }}>
                  {addition.dishName}
                </p>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  {addition.reason}
                </p>
                <div
                  className="text-xs font-medium px-2 py-1 rounded inline-block"
                  style={{
                    background: "var(--success-soft)",
                    color: "var(--success)",
                  }}>
                  {addition.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combo Suggestions */}
      {menuStrategy.comboSuggestions && menuStrategy.comboSuggestions.length > 0 && (
        <div>
          <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>
            {t('dashboard.analytics.menu.comboSuggestions')}
          </h5>
          <div className="space-y-2">
            {menuStrategy.comboSuggestions.map((combo, index) => (
              <div
                key={index}
                className="rounded-lg p-3"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                <div className="flex items-center gap-2 mb-2">
                  {combo.dishes.map((dish, i) => (
                    <React.Fragment key={i}>
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {dish}
                      </span>
                      {i < combo.dishes.length - 1 && (
                        <span style={{ color: "var(--text-muted)" }}>+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--primary)" }}>
                    {formatVND(combo.suggestedPrice)}
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: "var(--success-soft)",
                      color: "var(--success)",
                    }}>
                    +{formatVND(combo.aovIncrease)} AOV
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {combo.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
