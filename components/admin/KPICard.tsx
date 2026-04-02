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
  iconBg?: string;
  iconColor?: string;
  borderAccent?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconBg = "rgba(59, 130, 246, 0.1)",
  iconColor = "#3b82f6",
  borderAccent,
}: KPICardProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--card)",
        border: borderAccent
          ? `1px solid ${borderAccent}`
          : "1px solid var(--border)",
      }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {title}
          </p>
          <p
            className="text-3xl font-bold mt-1"
            style={{ color: "var(--text)" }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ background: iconBg, color: iconColor }}>
            {icon}
          </div>
          {trend && (
            <div
              className="flex items-center gap-1 text-xs font-bold"
              style={{
                color: trend.isPositive ? "#22c55e" : "#ef4444",
              }}>
              <svg
                className={`w-3 h-3 ${trend.isPositive ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
