import { addDays, startOfWeek, type DateKey } from "./zoned-time";

/** Six full weeks, so the calendar never changes height between months. */
const GRID_DAYS = 42;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "2026-10-17" → "2026-10-01" */
export function startOfMonth(dateKey: DateKey): DateKey {
  return `${dateKey.slice(0, 7)}-01`;
}

export function isSameMonth(a: DateKey, b: DateKey): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** Shifts by whole months, clamping the day so Jan 31 + 1 month → Feb 28/29. */
export function addMonths(dateKey: DateKey, months: number): DateKey {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(5, 7)) - 1 + months;
  const targetYear = year + Math.floor(month / 12);
  const targetMonth = ((month % 12) + 12) % 12;
  const day = Math.min(Number(dateKey.slice(8, 10)), daysInMonth(targetYear, targetMonth + 1));
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The 42 days (Monday-first weeks) shown for the month containing `dateKey`. */
export function getMonthGrid(dateKey: DateKey): DateKey[] {
  const first = startOfWeek(startOfMonth(dateKey));
  return Array.from({ length: GRID_DAYS }, (_, index) => addDays(first, index));
}
