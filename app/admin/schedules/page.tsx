"use client";

import StaffListModal from "@/components/admin/schedule/StaffListModal";
import TimeSlotGrid from "@/components/admin/schedule/TimeSlotGrid";
import TimeSlotManagementModal from "@/components/admin/schedule/TimeSlotManagementModal";
import WeekNavigator from "@/components/admin/schedule/WeekNavigator";
import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  ScheduleCell,
  Staff,
  StaffAssignment,
  TimeSlot,
  WeekSchedule,
} from "@/lib/types/schedule";
import {
  DownloadOutlined,
  ScheduleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: "slot1", startTime: "07:00", endTime: "09:00" },
  { id: "slot2", startTime: "09:00", endTime: "11:00" },
  { id: "slot3", startTime: "11:00", endTime: "13:00" },
  { id: "slot4", startTime: "13:00", endTime: "15:00" },
  { id: "slot5", startTime: "15:00", endTime: "17:00" },
  { id: "slot6", startTime: "17:00", endTime: "19:00" },
  { id: "slot7", startTime: "19:00", endTime: "21:00" },
];

export default function SchedulesPage() {
  const { t } = useTranslation("common");
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<ScheduleCell | null>(null);

  // Time Slot Management State
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [isManageSlotsOpen, setIsManageSlotsOpen] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [currentWeek]);

  useEffect(() => {
    if (weekSchedule) {
      setWeekSchedule((prev) => (prev ? { ...prev, timeSlots } : null));
    }
  }, [timeSlots]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const schedule = getMockSchedule();
      schedule.timeSlots = timeSlots;
      setWeekSchedule(schedule);
    } catch (error) {
      console.error("Failed to load schedule:", error);
      const schedule = getMockSchedule();
      schedule.timeSlots = timeSlots;
      setWeekSchedule(schedule);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlots = (newSlots: TimeSlot[]) => {
    setTimeSlots(newSlots);
  };

  const handleCellClick = (cell: ScheduleCell) => {
    setSelectedCell(cell);
  };

  const handleAddStaff = (cell: ScheduleCell, staffId: string) => {
    if (!weekSchedule) return;

    const staff = getMockStaff().find((s) => s.id === staffId);
    if (!staff) return;

    const newAssignment: StaffAssignment = {
      id: `assignment-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      staffInitials: staff.initials,
      staffAvatar: staff.avatar,
      role: "Staff",
      status: "registered",
    };

    setWeekSchedule({
      ...weekSchedule,
      cells: weekSchedule.cells.map((c) =>
        c.date === cell.date && c.timeSlotId === cell.timeSlotId
          ? { ...c, assignments: [...c.assignments, newAssignment] }
          : c,
      ),
    });

    setSelectedCell({
      ...cell,
      assignments: [...cell.assignments, newAssignment],
    });
  };

  const handleRemoveStaff = (assignmentId: string) => {
    if (!weekSchedule || !selectedCell) return;

    setWeekSchedule({
      ...weekSchedule,
      cells: weekSchedule.cells.map((c) =>
        c.date === selectedCell.date && c.timeSlotId === selectedCell.timeSlotId
          ? {
              ...c,
              assignments: c.assignments.filter((a) => a.id !== assignmentId),
            }
          : c,
      ),
    });

    setSelectedCell({
      ...selectedCell,
      assignments: selectedCell.assignments.filter(
        (a) => a.id !== assignmentId,
      ),
    });
  };

  const handleExport = () => {
    alert(t("schedule.export.alert"));
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Content Section */}
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-xl shadow-sm border"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <ScheduleOutlined
                      style={{ fontSize: "24px", color: "#f97316" }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
                      {t("schedule.title")}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {t("schedule.subtitle")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    icon={<SettingOutlined />}
                    size="large"
                    onClick={() => setIsManageSlotsOpen(true)}
                    className="shadow-sm border"
                    style={{ 
                      background: "var(--card)", 
                      borderColor: "var(--border)",
                      color: "var(--text)" 
                    }}
                  >
                    {t("schedule.manage_time_slots")}
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    size="large"
                    onClick={handleExport}
                    className="shadow-sm border"
                    style={{ 
                      background: "var(--card)", 
                      borderColor: "var(--border)",
                      color: "var(--text)" 
                    }}
                  >
                    {t("schedule.export_schedule")}
                  </Button>
                </div>
              </div>

              <WeekNavigator
                currentWeek={currentWeek}
                onWeekChange={setCurrentWeek}
              />

              {loading ? (
                <div 
                  className="min-h-[400px] rounded-xl flex items-center justify-center border shadow-sm"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="font-medium" style={{ color: "var(--text-muted)" }}>
                      Loading schedule...
                    </p>
                  </div>
                </div>
              ) : weekSchedule ? (
                <TimeSlotGrid
                  weekSchedule={weekSchedule}
                  onCellClick={handleCellClick}
                />
              ) : (
                <div 
                  className="min-h-[300px] rounded-xl p-12 text-center border"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <p style={{ color: "var(--text-muted)" }}>No schedule data available</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {selectedCell && (
        <StaffListModal
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
          onAddStaff={handleAddStaff}
          onRemoveStaff={handleRemoveStaff}
          availableStaff={getMockStaff()}
        />
      )}

      <TimeSlotManagementModal
        isOpen={isManageSlotsOpen}
        onClose={() => setIsManageSlotsOpen(false)}
        timeSlots={timeSlots}
        onUpdateSlots={handleUpdateSlots}
      />
    </div>
  );
}

function getMockStaff(): Staff[] {
  return [
    {
      id: "staff1",
      name: "Ahsoka Tano",
      initials: "AT",
      roles: ["Staff"],
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahsoka",
    },
    {
      id: "staff2",
      name: "Arya Stark",
      initials: "AS",
      roles: ["Staff"],
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arya",
    },
    {
      id: "staff3",
      name: "Danny Targeryen",
      initials: "DT",
      roles: ["Staff"],
    },
    { id: "staff4", name: "Han Solo", initials: "HS", roles: ["Staff"] },
    {
      id: "staff5",
      name: "Jon Snow",
      initials: "JS",
      roles: ["Staff"],
    },
    {
      id: "staff6",
      name: "Kylo Ren",
      initials: "KR",
      roles: ["Staff"],
    },
    { id: "staff7", name: "Nicole R", initials: "NR", roles: ["Staff"] },
  ];
}

function getMockSchedule(): WeekSchedule {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Note: These are now managed by state, but kept for initial load structure
  const timeSlots: TimeSlot[] = [];

  const cells: ScheduleCell[] = [
    // Monday
    {
      date: format(addDays(weekStart, 0), "yyyy-MM-dd"),
      timeSlotId: "slot2",
      assignments: [
        {
          id: "a1",
          staffId: "staff2",
          staffName: "Arya Stark",
          staffInitials: "AS",
          role: "Staff",
          status: "confirmed",
        },
        {
          id: "a2",
          staffId: "staff5",
          staffName: "Jon Snow",
          staffInitials: "JS",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 0), "yyyy-MM-dd"),
      timeSlotId: "slot4",
      assignments: [
        {
          id: "a3",
          staffId: "staff6",
          staffName: "Kylo Ren",
          staffInitials: "KR",
          role: "Staff",
          status: "registered",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 0), "yyyy-MM-dd"),
      timeSlotId: "slot6",
      assignments: [
        {
          id: "a4",
          staffId: "staff7",
          staffName: "Nicole R",
          staffInitials: "NR",
          role: "Staff",
          status: "confirmed",
        },
        {
          id: "a5",
          staffId: "staff3",
          staffName: "Danny Targeryen",
          staffInitials: "DT",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },

    // Tuesday
    {
      date: format(addDays(weekStart, 1), "yyyy-MM-dd"),
      timeSlotId: "slot2",
      assignments: [
        {
          id: "a6",
          staffId: "staff1",
          staffName: "Ahsoka Tano",
          staffInitials: "AT",
          role: "Staff",
          status: "confirmed",
        },
        {
          id: "a7",
          staffId: "staff2",
          staffName: "Arya Stark",
          staffInitials: "AS",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 1), "yyyy-MM-dd"),
      timeSlotId: "slot4",
      assignments: [
        {
          id: "a8",
          staffId: "staff3",
          staffName: "Danny Targeryen",
          staffInitials: "DT",
          role: "Staff",
          status: "registered",
        },
        {
          id: "a9",
          staffId: "staff7",
          staffName: "Nicole R",
          staffInitials: "NR",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 1), "yyyy-MM-dd"),
      timeSlotId: "slot6",
      assignments: [],
    },

    // Wednesday
    {
      date: format(addDays(weekStart, 2), "yyyy-MM-dd"),
      timeSlotId: "slot2",
      assignments: [
        {
          id: "a10",
          staffId: "staff2",
          staffName: "Arya Stark",
          staffInitials: "AS",
          role: "Staff",
          status: "registered",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 2), "yyyy-MM-dd"),
      timeSlotId: "slot4",
      assignments: [
        {
          id: "a11",
          staffId: "staff3",
          staffName: "Danny Targeryen",
          staffInitials: "DT",
          role: "Staff",
          status: "confirmed",
        },
        {
          id: "a12",
          staffId: "staff4",
          staffName: "Han Solo",
          staffInitials: "HS",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 2), "yyyy-MM-dd"),
      timeSlotId: "slot5",
      assignments: [
        {
          id: "a13",
          staffId: "staff7",
          staffName: "Nicole R",
          staffInitials: "NR",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },

    // Thursday
    {
      date: format(addDays(weekStart, 3), "yyyy-MM-dd"),
      timeSlotId: "slot3",
      assignments: [
        {
          id: "a14",
          staffId: "staff5",
          staffName: "Jon Snow",
          staffInitials: "JS",
          role: "Staff",
          status: "confirmed",
        },
        {
          id: "a15",
          staffId: "staff6",
          staffName: "Kylo Ren",
          staffInitials: "KR",
          role: "Staff",
          status: "registered",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 3), "yyyy-MM-dd"),
      timeSlotId: "slot5",
      assignments: [
        {
          id: "a16",
          staffId: "staff3",
          staffName: "Danny Targeryen",
          staffInitials: "DT",
          role: "Staff",
          status: "registered",
        },
        {
          id: "a17",
          staffId: "staff7",
          staffName: "Nicole R",
          staffInitials: "NR",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },

    // Friday
    {
      date: format(addDays(weekStart, 4), "yyyy-MM-dd"),
      timeSlotId: "slot2",
      assignments: [
        {
          id: "a18",
          staffId: "staff2",
          staffName: "Arya Stark",
          staffInitials: "AS",
          role: "Staff",
          status: "confirmed",
        },
        {
          id: "a19",
          staffId: "staff5",
          staffName: "Jon Snow",
          staffInitials: "JS",
          role: "Staff",
          status: "registered",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 4), "yyyy-MM-dd"),
      timeSlotId: "slot4",
      assignments: [
        {
          id: "a20",
          staffId: "staff4",
          staffName: "Han Solo",
          staffInitials: "HS",
          role: "Staff",
          status: "registered",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 4), "yyyy-MM-dd"),
      timeSlotId: "slot6",
      assignments: [
        {
          id: "a21",
          staffId: "staff7",
          staffName: "Nicole R",
          staffInitials: "NR",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },

    // Saturday
    {
      date: format(addDays(weekStart, 5), "yyyy-MM-dd"),
      timeSlotId: "slot3",
      assignments: [],
    },
    {
      date: format(addDays(weekStart, 5), "yyyy-MM-dd"),
      timeSlotId: "slot5",
      assignments: [
        {
          id: "a22",
          staffId: "staff1",
          staffName: "Ahsoka Tano",
          staffInitials: "AT",
          role: "Staff",
          status: "registered",
        },
        {
          id: "a23",
          staffId: "staff3",
          staffName: "Danny Targeryen",
          staffInitials: "DT",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },

    // Sunday
    {
      date: format(addDays(weekStart, 6), "yyyy-MM-dd"),
      timeSlotId: "slot2",
      assignments: [
        {
          id: "a24",
          staffId: "staff2",
          staffName: "Arya Stark",
          staffInitials: "AS",
          role: "Staff",
          status: "registered",
        },
        {
          id: "a25",
          staffId: "staff5",
          staffName: "Jon Snow",
          staffInitials: "JS",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },
    {
      date: format(addDays(weekStart, 6), "yyyy-MM-dd"),
      timeSlotId: "slot6",
      assignments: [
        {
          id: "a26",
          staffId: "staff1",
          staffName: "Ahsoka Tano",
          staffInitials: "AT",
          role: "Staff",
          status: "confirmed",
        },
      ],
    },
  ];

  return { weekStart, weekEnd, timeSlots, cells };
}
