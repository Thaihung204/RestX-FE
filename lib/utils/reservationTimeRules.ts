export const MIN_ADVANCE_BOOKING_MINUTES = 30;

export function isSlotValid(
  slotTime: Date,
  now: Date,
  closingTime: Date,
): boolean {
  const minAllowed = new Date(now.getTime() + MIN_ADVANCE_BOOKING_MINUTES * 60 * 1000);
  return slotTime >= minAllowed && slotTime <= closingTime;
}

export function getValidSlots(
  date: Date,
  openingHour: number,
  closingHour: number,
  intervalMinutes = 30,
): Date[] {
  const now = new Date();
  const slots: Date[] = [];

  const openingTime = new Date(date);
  openingTime.setHours(openingHour, 0, 0, 0);

  const closingTime = new Date(date);
  closingTime.setHours(closingHour, 0, 0, 0);

  let cursor = new Date(openingTime);
  while (cursor <= closingTime) {
    if (isSlotValid(cursor, now, closingTime)) {
      slots.push(new Date(cursor));
    }
    cursor = new Date(cursor.getTime() + intervalMinutes * 60 * 1000);
  }

  return slots;
}