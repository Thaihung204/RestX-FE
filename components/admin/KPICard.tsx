"use client";

import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: "normal" | "warning" | "success";
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  status = "normal",
}: KPICardProps) {
  const statusStyles: Record<
    NonNullable<KPICardProps["status"]>,
    { background: string; border: string }
  > = {
    normal: {
      background: "var(--card)",
      border: "1px solid var(--border)",
    },
    warning: {
      background:
        "linear-gradient(135deg, rgba(255, 122, 0, 0.12) 0%, rgba(255, 122, 0, 0.05) 100%)",
      border: "1px solid rgba(255, 122, 0, 0.25)",
    },
    success: {
      background:
        "linear-gradient(135deg, rgba(82, 196, 26, 0.14) 0%, rgba(82, 196, 26, 0.06) 100%)",
      border: "1px solid rgba(82, 196, 26, 0.3)",
    },
  };

  return (
    <div
      className="rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
      style={statusStyles[status]}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-3 rounded-lg"
          style={{
            background: "rgba(255, 122, 0, 0.12)",
            border: "1px solid rgba(255, 122, 0, 0.25)",
            color: "#FF380B",
          }}>
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              trend.isPositive ? "text-green-400" : "text-red-400"
            }`}>
            <svg
              className={`w-4 h-4 ${trend.isPositive ? "" : "rotate-180"}`}
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
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {title}
        </h3>
        <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
