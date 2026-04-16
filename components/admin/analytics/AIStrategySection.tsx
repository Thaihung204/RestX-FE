"use client";

import React from "react";

interface AIStrategySectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "warning" | "success" | "primary";
}

export default function AIStrategySection({
  title,
  icon,
  children,
  variant = "default",
}: AIStrategySectionProps) {
  const variantStyles = {
    default: {
      iconBg: "var(--surface)",
      iconColor: "var(--text)",
      borderColor: "var(--border)",
    },
    warning: {
      iconBg: "var(--warning-soft)",
      iconColor: "var(--warning)",
      borderColor: "var(--warning-border)",
    },
    success: {
      iconBg: "var(--success-soft)",
      iconColor: "var(--success)",
      borderColor: "var(--success-border)",
    },
    primary: {
      iconBg: "var(--primary-soft)",
      iconColor: "var(--primary)",
      borderColor: "var(--primary-border)",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "var(--card)",
        border: `1px solid ${style.borderColor}`,
      }}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: style.iconBg, color: style.iconColor }}>
          {icon}
        </div>
        <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
