"use client";

import React from "react";
import { useTranslation } from "react-i18next";

type TenantStatus = "active" | "inactive" | "maintenance";

interface Props {
  status: TenantStatus;
}

const TenantStatusPill: React.FC<Props> = ({ status }) => {
  const { t } = useTranslation();

  return (
    <div className={`tenant-status-beacon tenant-status-${status}`}>
      <span className="tenant-status-beacon-dot" />
      <span>{t(`tenants.status.${status}`)}</span>
    </div>
  );
};

export default TenantStatusPill;
