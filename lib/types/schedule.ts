export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  staffName: string;
  staffInitials: string;
  staffAvatar?: string;
  role: string;
  status: "registered" | "confirmed" | "cancelled";
}

export interface ScheduleCell {
  date: string;
  timeSlotId: string;
  assignments: StaffAssignment[];
}

export interface WeekSchedule {
  weekStart: Date;
  weekEnd: Date;
  timeSlots: TimeSlot[];
  cells: ScheduleCell[];
}

export interface Staff {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  roles: string[];
}
