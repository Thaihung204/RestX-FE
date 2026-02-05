"use client";

import React from "react";
import { useTranslation } from "react-i18next";

type TenantStatus = "active" | "inactive" | "maintenance";

interface Props {
  status: TenantStatus;
}

const STATUS_CONFIG: Record<
  TenantStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  active: {
    bg: "rgba(34,197,94,0.12)", // green-500
    border: "rgba(34,197,94,0.35)",
    text: "#166534",
    dot: "#22C55E",
  },
  inactive: {
    bg: "rgba(248,113,113,0.10)", // red-400
    border: "rgba(248,113,113,0.35)",
    text: "#991B1B",
    dot: "#F97373",
  },
  maintenance: {
    bg: "rgba(255,56,11,0.10)",
    border: "rgba(249,115,22,0.35)",
    text: "#9A3412",
    dot: "#F97316",
  },
};

const TenantStatusPill: React.FC<Props> = ({ status }) => {
  const { t } = useTranslation();
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
        minWidth: "100px",
        justifyContent: "center",
      }}>
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
          fontSize: 11,
          fontWeight: 500,
          color: style.text,
          whiteSpace: "nowrap",
        }}>
        {t(`tenants.status.${status}`)}
      </span>
    </div>
  );
};

export default TenantStatusPill;
