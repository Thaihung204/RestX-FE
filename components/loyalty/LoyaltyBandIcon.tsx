"use client";

import { WorkspacePremium } from "@mui/icons-material";
import React from "react";

type LoyaltyBandIconProps = {
  color?: string;
  size?: number;
  title?: string;
};

export default function LoyaltyBandIcon({
  color,
  size = 24,
  title,
}: LoyaltyBandIconProps) {
  return (
    <WorkspacePremium
      sx={{
        fontSize: size,
        color: color || "var(--text-muted)",
        // Thêm viền/bóng nhẹ để các màu rất sáng (như platinum) vẫn nhìn rõ ở light mode
        filter: "drop-shadow(0 0 1px rgba(0,0,0,0.35))",
      }}
      titleAccess={title}
    />
  );
}

