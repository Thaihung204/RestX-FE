"use client";

import { useTranslation } from "react-i18next";

interface AIStrategyStatsRowProps {
  alertCount: number;
  opportunityCount: number;
  riskCount: number;
  actionCount: number;
}

export default function AIStrategyStatsRow({
  alertCount,
  opportunityCount,
  riskCount,
  actionCount,
}: AIStrategyStatsRowProps) {
  const { t } = useTranslation("common");
  
  const stats = [
    {
      label: t('dashboard.analytics.stats.alerts'),
      value: alertCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      color: "var(--warning)",
      bg: "var(--warning-soft)",
    },
    {
      label: t('dashboard.analytics.stats.opportunities'),
      value: opportunityCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      color: "var(--success)",
      bg: "var(--success-soft)",
    },
    {
      label: t('dashboard.analytics.stats.risks'),
      value: riskCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "var(--danger)",
      bg: "var(--danger-soft)",
    },
    {
      label: t('dashboard.analytics.stats.actions'),
      value: actionCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      color: "var(--primary)",
      bg: "var(--primary-soft)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-xl p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                {stat.value}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
