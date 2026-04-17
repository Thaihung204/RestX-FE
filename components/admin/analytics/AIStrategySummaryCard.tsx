"use client";


interface AIStrategySummaryCardProps {
  summary: string;
  alertCount: number;
  generatedAt: string;
}

import { useTranslation } from "react-i18next";

export default function AIStrategySummaryCard({
  summary,
  alertCount,
  generatedAt,
}: AIStrategySummaryCardProps) {
  const { t } = useTranslation("common");
  return (
    <div
      className="rounded-2xl p-6 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,56,11,0.12) 0%, rgba(255,56,11,0.04) 100%), var(--card)",
        border: "1px solid var(--primary-border)",
      }}>
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--primary-soft)",
            color: "var(--primary)",
          }}>
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--text)" }}>
              {t('dashboard.analytics.summary.title')}
            </h3>
            {alertCount > 0 && (
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: "var(--warning-soft)",
                  color: "var(--warning)",
                  border: "1px solid var(--warning-border)",
                }}>
                {alertCount} {t('dashboard.analytics.summary.alerts')}
              </span>
            )}
          </div>
          <p
            className="text-base leading-relaxed mb-3"
            style={{ color: "var(--text)" }}>
            {summary}
          </p>
          <div className="flex items-center gap-2 text-xs">
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
            <span style={{ color: "var(--text-muted)" }}>
              {t('dashboard.analytics.summary.generatedAt')} {new Date(generatedAt).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
