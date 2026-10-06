import { daysBetween, formatMinutes, minutesSinceMidnight, type DateKey } from "./zoned-time";

// A fixed locale keeps server and client rendering identical (no hydration
// mismatches) and matches the product's 24-hour time display.
const LOCALE = "en-US";

function dateKeyToUtcNoon(dateKey: DateKey): Date {
  return new Date(`${dateKey}T12:00:00Z`);
}

/** "Monday, October 5" */
export function formatLongDate(dateKey: DateKey): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dateKeyToUtcNoon(dateKey));
}

/** "Oct 5" */
export function formatShortDate(dateKey: DateKey): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", month: "short", day: "numeric" }).format(
    dateKeyToUtcNoon(dateKey),
  );
}

/** "Mon" */
export function formatWeekdayShort(dateKey: DateKey): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", weekday: "short" }).format(
    dateKeyToUtcNoon(dateKey),
  );
}

/** "Monday" */
export function formatWeekdayLong(dateKey: DateKey): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", weekday: "long" }).format(
    dateKeyToUtcNoon(dateKey),
  );
}

/** "Today", "Tomorrow", "Yesterday", "Thursday" (within a week) or "Oct 12". */
export function formatRelativeDay(dateKey: DateKey, todayKey: DateKey): string {
  const diff = daysBetween(todayKey, dateKey);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return formatWeekdayLong(dateKey);
  return formatShortDate(dateKey);
}

/** Local "HH:MM" for an instant. */
export function formatTimeOfDay(instant: Date, timeZone: string): string {
  return formatMinutes(minutesSinceMidnight(instant, timeZone));
}

/** 45 → "45 min", 60 → "1 h", 90 → "1 h 30 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function getGreeting(minutesOfDay: number): string {
  if (minutesOfDay < 5 * 60) return "Good evening";
  if (minutesOfDay < 12 * 60) return "Good morning";
  if (minutesOfDay < 18 * 60) return "Good afternoon";
  return "Good evening";
}
