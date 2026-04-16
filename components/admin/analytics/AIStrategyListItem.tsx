"use client";


interface AIStrategyListItemProps {
  title: string;
  insight?: string;
  reason?: string;
  action: string;
  when: string;
  impact: "high" | "medium" | "low";
  type?: string;
  variant?: "risk" | "opportunity" | "action" | "default";
}

import { useTranslation } from "react-i18next";

export default function AIStrategyListItem({
  title,
  insight,
  reason,
  action,
  when,
  impact,
  type,
  variant = "default",
}: AIStrategyListItemProps) {
  const { t } = useTranslation("common");

  const impactColors = {
    high: {
      bg: "var(--danger-soft)",
      color: "var(--text)",
      border: "var(--danger)",
      label: t('dashboard.analytics.impact.high'),
    },
    medium: {
      bg: "var(--warning-soft)",
      color: "var(--text)",
      border: "var(--warning)",
      label: t('dashboard.analytics.impact.medium'),
    },
    low: {
      bg: "var(--success-soft)",
      color: "var(--text)",
      border: "var(--success)",
      label: t('dashboard.analytics.impact.low'),
    },
  };

  const variantStyles = {
    risk: {
      accentColor: "var(--danger)",
      accentBg: "var(--danger-soft)",
    },
    opportunity: {
      accentColor: "var(--success)",
      accentBg: "var(--success-soft)",
    },
    action: {
      accentColor: "var(--primary)",
      accentBg: "var(--primary-soft)",
    },
    default: {
      accentColor: "var(--text)",
      accentBg: "var(--surface)",
    },
  };

  const impactStyle = impactColors[impact];
  const style = variantStyles[variant];

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--surface)",
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${style.accentColor}`,
      }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-bold text-base" style={{ color: "var(--text)" }}>
          {title}
        </h4>
        <div className="flex items-center gap-2 flex-shrink-0">
          {type && (
            <span
              className="px-2 py-1 rounded text-xs font-bold"
              style={{
                background: style.accentBg,
                color: "var(--text)",
                border: `1px solid ${style.accentColor}`,
              }}>
              {type}
            </span>
          )}
          <span
            className="px-2 py-1 rounded text-xs font-bold"
            style={{
              background: impactStyle.bg,
              color: impactStyle.color,
              border: `1px solid ${impactStyle.border}`,
            }}>
            {impactStyle.label}
          </span>
        </div>
      </div>

      {(insight || reason) && (
        <p
          className="text-sm mb-3 leading-relaxed"
          style={{ color: "var(--text-muted)" }}>
          {insight || reason}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            style={{ color: style.accentColor }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {t('dashboard.analytics.labels.action')}
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {action}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t('dashboard.analytics.labels.time')} <span className="font-medium">{when}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
