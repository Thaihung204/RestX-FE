"use client";

import { Tag } from "antd";
import React from "react";

type TenantPlan = "basic" | "pro" | "enterprise";

interface Props {
  plan: TenantPlan;
}

const PLAN_CONFIG: Record<
  TenantPlan,
  { bg: string; border: string; text: string }
> = {
  enterprise: {
    bg: "rgba(147,51,234,0.10)", // purple-600
    border: "rgba(147,51,234,0.35)",
    text: "#5B21B6",
  },
  pro: {
    bg: "rgba(37,99,235,0.10)", // blue-600
    border: "rgba(37,99,235,0.35)",
    text: "#1D4ED8",
  },
  basic: {
    bg: "rgba(55,65,81,0.08)", // gray-600
    border: "rgba(55,65,81,0.25)",
    text: "#374151",
  },
};

const TenantPlanTag: React.FC<Props> = ({ plan }) => {
  const style = PLAN_CONFIG[plan];

  return (
    <Tag
      variant="filled"
      style={{
        textTransform: "uppercase",
        fontSize: 10,
        fontWeight: 700,
        paddingInline: 10,
        paddingBlock: 2,
        borderRadius: 999,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        letterSpacing: 0.4,
      }}
    >
      {plan}
    </Tag>
  );
};

export default TenantPlanTag;


