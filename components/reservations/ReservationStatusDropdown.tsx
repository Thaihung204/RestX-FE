"use client";

import { ReservationStatus } from "@/lib/services/reservationService";
import { Select } from "antd";
import { useTranslation } from "react-i18next";

export type ReservationStatusDropdownOption = {
  label: string;
  color: string;
  disabled?: boolean;
  hidden?: boolean;
};

type ReservationStatusDropdownProps = {
  value: number;
  statuses: ReservationStatus[];
  onChange: (value: number) => void;
  mapStatus: (status: ReservationStatus) => ReservationStatusDropdownOption;
  disabled?: boolean;
  loading?: boolean;
  minWidth?: number;
  className?: string;
};

const STATUS_FLOW_ORDER: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  CHECKED_IN: 2,
  COMPLETED: 3,
  CANCELLED: 99,
  NO_SHOW: 99,
  NOSHOW: 99,
};

export function ReservationStatusDropdown({
  value,
  statuses,
  onChange,
  mapStatus,
  disabled = false,
  loading = false,
  minWidth = 150,
  className,
}: ReservationStatusDropdownProps) {
  const { t } = useTranslation();

  const mappedStatuses = statuses.map((status) => {
    const mapped = mapStatus(status);
    return {
      status,
      ...mapped,
    };
  });

  const visibleOptions = mappedStatuses.filter((s) => !s.hidden);
  const currentStatus = mappedStatuses.find((s) => s.status.id === value);
  const currentFlowOrder = STATUS_FLOW_ORDER[currentStatus?.status.code?.toUpperCase() ?? ""] ?? 0;

  const isDisabled = disabled || statuses.length === 0 || loading;

  return (
    <Select
      value={value}
      disabled={isDisabled}
      loading={loading}
      size="middle"
      variant="borderless"
      style={{ minWidth }}
      className={`reservation-status-select ${className ?? ""}`}
      onChange={(val) => onChange(Number(val))}
      options={visibleOptions.map((s) => {
        const statusOrder = STATUS_FLOW_ORDER[s.status.code?.toUpperCase() ?? ""] ?? 0;
        const isPast = statusOrder < currentFlowOrder && s.status.id !== value;
        const isDisabledOption = s.disabled || isPast;

        return {
          value: s.status.id,
          disabled: isDisabledOption,
          label: (
            <span
              style={{
                color: isPast ? "var(--text-muted)" : s.color,
                fontWeight: 600,
                fontSize: 13,
                opacity: isPast ? 0.45 : 1,
              }}
            >
              {s.label}
            </span>
          ),
          rawLabel: s.label,
          color: s.color,
          isPast,
        };
      })}
      optionRender={(opt: any) => (
        <div
          className="flex items-center justify-center gap-1 text-center"
          style={{ opacity: opt.data.isPast ? 0.4 : 1 }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: opt.data.color }}
          />
          <span
            style={{
              color: opt.data.isPast ? "var(--text-muted)" : opt.data.color,
              fontWeight: 600,
            }}
          >
            {opt.data.rawLabel}
          </span>
        </div>
      )}
    />
  );
}