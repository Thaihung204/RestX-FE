"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface StaffMember {
  positionKey: string;
  onDuty: number;
  total: number;
  color: string;
}

const staffData: StaffMember[] = [
  { positionKey: "waiter", onDuty: 6, total: 8, color: "#3b82f6" },
  { positionKey: "kitchen", onDuty: 4, total: 5, color: "#F97316" },
];

export default function StaffOverview() {
  const { t } = useTranslation();
  const router = useRouter();

  const totalStaff = staffData.reduce((s, p) => s + p.total, 0);
  const totalOnDuty = staffData.reduce((s, p) => s + p.onDuty, 0);
  const totalOff = totalStaff - totalOnDuty;

  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-bold mb-0.5" style={{ color: "var(--text)" }}>
          {t("dashboard.staff_overview.title")}
        </h3>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t("dashboard.staff_overview.subtitle")}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className="rounded-lg p-3 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
            {totalStaff}
          </p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.staff_overview.total_staff")}
          </p>
        </div>
        <div
          className="rounded-lg p-3 text-center"
          style={{ background: "rgba(34, 197, 94, 0.06)", border: "1px solid rgba(34, 197, 94, 0.15)" }}>
          <p className="text-xl font-bold" style={{ color: "#22c55e" }}>
            {totalOnDuty}
          </p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.staff_overview.on_duty")}
          </p>
        </div>
        <div
          className="rounded-lg p-3 text-center"
          style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
          <p className="text-xl font-bold" style={{ color: "#ef4444" }}>
            {totalOff}
          </p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.staff_overview.day_off")}
          </p>
        </div>
      </div>

      {/* Staff by position */}
      <div className="flex-1 space-y-2.5">
        {staffData.map((staff) => {
          const pct = (staff.onDuty / staff.total) * 100;
          return (
            <div key={staff.positionKey} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: staff.color }}
              />
              <p className="text-xs font-medium flex-1 min-w-0" style={{ color: "var(--text)" }}>
                {t(`dashboard.staff_overview.positions.${staff.positionKey}`)}
              </p>
              <div className="w-20 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: staff.color }}
                />
              </div>
              <p className="text-xs font-semibold flex-shrink-0 w-8 text-right" style={{ color: "var(--text-muted)" }}>
                {staff.onDuty}/{staff.total}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <button
        onClick={() => router.push("/admin/staff")}
        className="mt-4 pt-3 w-full text-center text-xs font-semibold transition-colors hover:underline"
        style={{ borderTop: "1px solid var(--border)", color: "var(--primary)" }}>
        {t("dashboard.staff_overview.view_all")} →
      </button>
    </div>
  );
}
