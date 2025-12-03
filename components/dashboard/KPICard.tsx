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
  const statusColors = {
    normal: "from-gray-800 to-gray-900 border-gray-700",
    warning: "from-orange-900/30 to-gray-900 border-orange-500/30",
    success: "from-green-900/30 to-gray-900 border-green-500/30",
  };

  return (
    <div
      className={`bg-gradient-to-br ${statusColors[status]} border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
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
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && (
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
