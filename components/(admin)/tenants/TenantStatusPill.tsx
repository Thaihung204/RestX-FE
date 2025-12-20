"use client";

import React from "react";

type TenantStatus = "active" | "inactive" | "maintenance";

interface Props {
  status: TenantStatus;
}

const STATUS_CONFIG: Record<
  TenantStatus,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  active: {
    label: "Active",
    bg: "rgba(34,197,94,0.12)", // green-500
    border: "rgba(34,197,94,0.35)",
    text: "#166534",
    dot: "#22C55E",
  },
  inactive: {
    label: "Inactive",
    bg: "rgba(248,113,113,0.10)", // red-400
    border: "rgba(248,113,113,0.35)",
    text: "#991B1B",
    dot: "#F97373",
  },
  maintenance: {
    label: "Maintenance",
    bg: "rgba(249,115,22,0.10)", // orange-500
    border: "rgba(249,115,22,0.35)",
    text: "#9A3412",
    dot: "#F97316",
  },
};

const TenantStatusPill: React.FC<Props> = ({ status }) => {
  const style = STATUS_CONFIG[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        paddingInline: 10,
        paddingBlock: 4,
        borderRadius: 999,
        border: `1px solid ${style.border}`,
        backgroundColor: style.bg,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "999px",
          marginRight: 6,
          backgroundColor: style.dot,
          boxShadow: "0 0 0 3px rgba(0,0,0,0.03)",
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: style.text,
        }}
      >
        {style.label}
      </span>
    </div>
  );
};

export default TenantStatusPill;


