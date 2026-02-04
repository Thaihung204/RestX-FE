"use client";

import { ScheduleCell, TimeSlot, WeekSchedule } from "@/lib/types/schedule";
import { ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  set,
  startOfWeek,
} from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface TimeSlotGridProps {
  weekSchedule: WeekSchedule;
  onCellClick: (cell: ScheduleCell) => void;
}

export default function TimeSlotGrid({
  weekSchedule,
  onCellClick,
}: TimeSlotGridProps) {
  const { t, i18n } = useTranslation("common");
  const [currentVNTime, setCurrentVNTime] = useState<Date | null>(null);

  // Initialize and tick clock for Vietnam Time
  useEffect(() => {
    const updateTime = () => {
      // Create a date object strictly for Vietnam Time (GMT+7)
      const now = new Date();
      const vnTimeStr = now.toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
      setCurrentVNTime(new Date(vnTimeStr));
    };

    updateTime(); // Initial call
    const timer = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(weekSchedule.weekStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekSchedule.weekStart]);

  const getCell = (date: Date, timeSlotId: string): ScheduleCell => {
    const dateString = format(date, "yyyy-MM-dd");
    const cell = weekSchedule.cells.find(
      (c) => c.date === dateString && c.timeSlotId === timeSlotId,
    );

    return (
      cell || {
        date: dateString,
        timeSlotId,
        assignments: [],
      }
    );
  };

  /**
   * determines if a cell is in the past, present, or future relative to Vietnam Time
   */
  const getTimeStatus = (cellDate: Date, slot: TimeSlot) => {
    if (!currentVNTime) return "future";

    // Parse slot times (HH:mm)
    const [startHour, startMin] = slot.startTime.split(":").map(Number);
    const [endHour, endMin] = slot.endTime.split(":").map(Number);

    // Create Date objects for the slot's start and end, using the cell's date
    const slotStart = set(cellDate, {
      hours: startHour,
      minutes: startMin,
      seconds: 0,
    });
    let slotEnd = set(cellDate, {
      hours: endHour,
      minutes: endMin,
      seconds: 0,
    });

    // Handle overnight slots (if end time is earlier than start time, it assumes next day)
    if (isBefore(slotEnd, slotStart)) {
      slotEnd = addDays(slotEnd, 1);
    }

    // Compare timestamp
    if (isAfter(currentVNTime, slotEnd)) {
      return "past";
    }

    if (isBefore(currentVNTime, slotStart)) {
      return "future";
    }

    return "current";
  };

  const getCellStyles = (
    timeStatus: "past" | "current" | "future",
    hasAssignments: boolean,
  ) => {
    // defaults
    let style: React.CSSProperties = {
      background: "var(--surface)",
      borderColor: "var(--border)",
      color: "var(--text)",
    };
    let className =
      "border-2 hover:border-gray-400 custom-transition relative overflow-hidden flex flex-col gap-2 rounded-xl p-3 w-full h-[120px]";

    if (hasAssignments) {
      // assigned style - keep partial transparent blue for now, or use variable if available
      // Using a hardcoded light blue overlay effect might be safest if variables aren't defined for "assigned"
      // But better to use standard surface and let the assigned indicator be the text/highlight
      style.background = "rgba(59, 130, 246, 0.1)"; // blue-500 @ 10%
      style.borderColor = "rgba(59, 130, 246, 0.3)";
    }

    // Overlay Time Status Styles
    if (timeStatus === "past") {
      className += " opacity-50 grayscale-[0.8]";
    } else if (timeStatus === "current") {
      className +=
        " ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent shadow-lg scale-[1.02] z-10";
    }

    return { style, className };
  };

  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm border flex flex-col h-full"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)"
      }}
    >
      {/* Legend / Status Info */}
      <div
        className="p-3 border-b flex items-center justify-end gap-4 text-xs"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text-muted)"
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400/50"></span>
          <span>{t("schedule.legend.past")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="font-medium text-blue-500">
            {t("schedule.legend.live_now")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-gray-400"></span>
          <span>{t("schedule.legend.future")}</span>
        </div>
        <div className="pl-2 border-l border-gray-200 ml-2">
          {currentVNTime && format(currentVNTime, "HH:mm (z)")}
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr>
              <th
                className="p-4 text-left font-semibold sticky left-0 z-20 border-b border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[140px]"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)"
                }}
              >
                <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <ClockCircleOutlined />
                  <span>{t("schedule.time_slot")}</span>
                </div>
              </th>
              {weekDays.map((day, index) => {
                const isToday = currentVNTime && isSameDay(day, currentVNTime);

                return (
                  <th
                    key={index}
                    className="p-4 text-center border-b min-w-[160px] relative"
                    style={{
                      background: isToday ? "rgba(59, 130, 246, 0.05)" : "var(--surface)",
                      borderColor: "var(--border)"
                    }}
                  >
                    <div
                      className="font-bold text-lg"
                      style={{ color: isToday ? "#2563eb" : "var(--text)" }} // blue-600
                    >
                      {format(day, "EEE", { locale: i18n.language === 'vi' ? vi : enUS })}
                    </div>
                    <div
                      className="text-xs font-medium uppercase tracking-wider mt-1"
                      style={{ color: isToday ? "#3b82f6" : "var(--text-muted)" }} // blue-500
                    >
                      {format(day, "MMM d", { locale: i18n.language === 'vi' ? vi : enUS })}
                    </div>
                    {isToday && (
                      <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500" />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {weekSchedule.timeSlots.map((timeSlot) => (
              <tr
                key={timeSlot.id}
                className="group transition-colors hover:bg-black/5"
              >
                <td
                  className="p-4 font-medium sticky left-0 z-10 border-r border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors"
                  style={{
                    background: "var(--card)",
                    borderColor: "var(--border)"
                  }}
                >
                  <div className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <ClockCircleOutlined className="text-base" />
                    {timeSlot.startTime} - {timeSlot.endTime}
                  </div>
                </td>

                {weekDays.map((day, dayIndex) => {
                  const cell = getCell(day, timeSlot.id);
                  const timeStatus = getTimeStatus(day, timeSlot);
                  const assignedCount = cell.assignments.filter(
                    (a) => a.status !== "cancelled",
                  ).length;
                  const hasAssignments = assignedCount > 0;
                  const { style, className } = getCellStyles(timeStatus, hasAssignments);

                  return (
                    <td
                      key={dayIndex}
                      className="p-3 border-b align-top relative"
                      style={{
                        borderColor: "var(--border)",
                        background: timeStatus === "current" ? "rgba(59, 130, 246, 0.05)" : undefined
                      }}
                    >
                      <button
                        onClick={() => onCellClick(cell)}
                        className={`group/cell ${className}`}
                        style={style}
                      >
                        {timeStatus === "current" && (
                          <div className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </div>
                        )}

                        <div className="flex items-center justify-center w-full h-full">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <UserOutlined className="text-2xl" style={{ color: "var(--text-muted)" }} />
                            </div>
                            <div className="text-3xl font-bold" style={{ color: "var(--text)" }}>
                              {assignedCount}
                            </div>
                            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                              {assignedCount === 0
                                ? t("schedule.status.no_staff")
                                : t("schedule.status.staff_assigned")}
                            </div>
                          </div>
                        </div>

                        {/* Hover Overlay Effect */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/cell:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {weekSchedule.timeSlots.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <ClockCircleOutlined
              style={{ fontSize: "48px", opacity: 0.3, marginBottom: "16px" }}
            />
            <p className="text-lg font-medium">
              No time slots configured
            </p>
            <p className="text-sm mt-2 opacity-60">
              Please configure operating hours in settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
