"use client";

import StatusToggle from "@/components/ui/StatusToggle";
import { TimePicker } from "@/components/ui/TimePicker";
import { BusinessHour } from "@/lib/types/tenant";
import React from "react";
import { useTranslation } from "react-i18next";

/** dayOfWeek → i18n key suffix */
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DEFAULT_HOURS: BusinessHour[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openTime: "09:00:00",
  closeTime: "22:00:00",
  isClosed: i === 0,
}));

/** Normalize "HH:mm:ss" → "HH:mm" for the TimePicker */
const toHHmm = (t: string): string => {
  if (!t) return "09:00";
  const parts = t.split(":");
  return `${parts[0].padStart(2, "0")}:${(parts[1] ?? "00").padStart(2, "0")}`;
};

/** Normalize "HH:mm" → "HH:mm:ss" for storage */
const toHHmmss = (t: string): string =>
  t.length === 5 ? `${t}:00` : t;

interface Props {
  value?: BusinessHour[];
  onChange?: (hours: BusinessHour[]) => void;
  disabled?: boolean;
}

const BusinessHoursEditor: React.FC<Props> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();

  const hours: BusinessHour[] = DEFAULT_HOURS.map((def) => {
    const found = value?.find((h) => h.dayOfWeek === def.dayOfWeek);
    return found ?? def;
  });

  const update = (dayOfWeek: number, patch: Partial<BusinessHour>) => {
    const next = hours.map((h) =>
      h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h,
    );
    onChange?.(next);
  };

  return (
    <div className="bhe-root">
      {/* Header */}
      <div className="bhe-header">
        <span className="bhe-col-day">{t("tenants.edit.fields.opening_hours_col_day")}</span>
        <span className="bhe-col-toggle">{t("tenants.edit.fields.opening_hours_col_open")}</span>
        <span className="bhe-col-times">{t("tenants.edit.fields.opening_hours_col_hours")}</span>
      </div>

      {hours.map((h) => (
        <div
          key={h.dayOfWeek}
          className={`bhe-row${h.isClosed ? " bhe-row--closed" : ""}`}
        >
          {/* Day label */}
          <div className="bhe-col-day">
            <span className="bhe-day-full">
              {t(`tenants.edit.fields.opening_hours_${DAY_KEYS[h.dayOfWeek]}`)}
            </span>
          </div>

          {/* Toggle */}
          <div className="bhe-col-toggle">
            <StatusToggle
              checked={!h.isClosed}
              disabled={disabled}
              ariaLabel={t(`tenants.edit.fields.opening_hours_${DAY_KEYS[h.dayOfWeek]}`)}
              onChange={() => update(h.dayOfWeek, { isClosed: !h.isClosed })}
            />
          </div>

          {/* Time pickers / closed badge */}
          <div className="bhe-col-times">
            {h.isClosed ? (
              <span className="bhe-closed-badge">
                {t("tenants.edit.fields.opening_hours_closed")}
              </span>
            ) : (
              <div className="bhe-time-row">
                <div className="bhe-picker-wrap">
                  <TimePicker
                    value={toHHmm(h.openTime)}
                    onChange={(time) =>
                      update(h.dayOfWeek, { openTime: toHHmmss(time) })
                    }
                    disabled={disabled}
                    placeholder={toHHmm(h.openTime)}
                  />
                </div>
                <span className="bhe-sep">—</span>
                <div className="bhe-picker-wrap">
                  <TimePicker
                    value={toHHmm(h.closeTime)}
                    onChange={(time) =>
                      update(h.dayOfWeek, { closeTime: toHHmmss(time) })
                    }
                    disabled={disabled}
                    placeholder={toHHmm(h.closeTime)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <style jsx global>{`
        .bhe-root {
          border: 1px solid var(--ant-color-border, rgba(255, 255, 255, 0.12));
          border-radius: 8px;
          overflow: hidden;
          font-size: 13px;
        }

        .bhe-header {
          display: grid;
          grid-template-columns: 140px 80px 1fr;
          align-items: center;
          padding: 8px 16px;
          background: var(--ant-color-fill-quaternary, rgba(255, 255, 255, 0.04));
          border-bottom: 1px solid var(--ant-color-border, rgba(255, 255, 255, 0.08));
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ant-color-text-tertiary, rgba(255, 255, 255, 0.4));
        }

        .bhe-row {
          display: grid;
          grid-template-columns: 140px 80px 1fr;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid var(--ant-color-border, rgba(255, 255, 255, 0.06));
          transition: background 0.15s;
        }
        .bhe-row:last-child {
          border-bottom: none;
        }
        .bhe-row:hover {
          background: var(--ant-color-fill-quaternary, rgba(255, 255, 255, 0.025));
        }
        .bhe-row--closed {
          opacity: 0.5;
        }

        .bhe-col-day {
          display: flex;
          align-items: center;
        }
        .bhe-col-toggle {
          display: flex;
          align-items: center;
        }
        .bhe-col-times {
          display: flex;
          align-items: center;
        }

        .bhe-day-full {
          font-size: 13px;
          color: var(--ant-color-text, rgba(255, 255, 255, 0.85));
          font-weight: 500;
        }

        .bhe-time-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bhe-picker-wrap {
          width: 110px;
        }
        .bhe-picker-wrap button {
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-size: 13px !important;
        }

        .bhe-sep {
          color: var(--ant-color-text-quaternary, rgba(255, 255, 255, 0.25));
          font-size: 12px;
          user-select: none;
        }

        .bhe-closed-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--ant-color-error, #f87171);
          background: var(--ant-color-error-bg, rgba(248, 113, 113, 0.1));
          border: 1px solid var(--ant-color-error-border, rgba(248, 113, 113, 0.2));
          border-radius: 4px;
          padding: 2px 10px;
          text-transform: uppercase;
        }

        @media (max-width: 520px) {
          .bhe-header,
          .bhe-row {
            grid-template-columns: 90px 64px 1fr;
            padding: 8px 10px;
          }
          .bhe-picker-wrap {
            width: 90px;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessHoursEditor;
