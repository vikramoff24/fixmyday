/**
 * Time-zone aware date helpers built on the platform Intl API.
 *
 * Conventions used across the app:
 * - A "date key" is a calendar day in the user's time zone: "YYYY-MM-DD".
 * - "Minutes" means minutes after local midnight (0–1439).
 * - Instants (Date objects) are always stored and transported in UTC.
 */

export type DateKey = string;

export const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = MINUTES_PER_DAY * MS_PER_MINUTE;

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    // Intl throws a RangeError for unknown zones; that is the answer we want.
    return false;
  }
}

export function isValidDateKey(value: string): boolean {
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function getZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts: Record<string, number> = {};
  for (const part of getPartsFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Offset of `timeZone` from UTC at `instant`, in minutes (e.g. +120 for CEST). */
export function getTimeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = getZonedParts(instant, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const instantWithoutMs = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((asUtc - instantWithoutMs) / MS_PER_MINUTE);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateKey(instant: Date, timeZone: string): DateKey {
  const { year, month, day } = getZonedParts(instant, timeZone);
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function minutesSinceMidnight(instant: Date, timeZone: string): number {
  const { hour, minute } = getZonedParts(instant, timeZone);
  return hour * 60 + minute;
}

function parseDateKey(dateKey: DateKey): { year: number; month: number; day: number } {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) throw new Error(`Invalid date key: ${dateKey}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Converts a local wall-clock time in `timeZone` to the matching UTC instant. */
export function zonedToUtc(dateKey: DateKey, minutes: number, timeZone: string): Date {
  const { year, month, day } = parseDateKey(dateKey);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, 0, minutes);

  // Two passes handle the rare case where the first guess lands on the other
  // side of a daylight-saving transition.
  let offset = getTimeZoneOffsetMinutes(new Date(wallClockAsUtc), timeZone);
  let result = wallClockAsUtc - offset * MS_PER_MINUTE;
  const correctedOffset = getTimeZoneOffsetMinutes(new Date(result), timeZone);
  if (correctedOffset !== offset) {
    offset = correctedOffset;
    result = wallClockAsUtc - offset * MS_PER_MINUTE;
  }
  return new Date(result);
}

export function addDays(dateKey: DateKey, days: number): DateKey {
  const { year, month, day } = parseDateKey(dateKey);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * MS_PER_DAY);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: DateKey, to: DateKey): number {
  const a = parseDateKey(from);
  const b = parseDateKey(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / MS_PER_DAY,
  );
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(dateKey: DateKey): number {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Monday of the week containing `dateKey`. */
export function startOfWeek(dateKey: DateKey): DateKey {
  const daysSinceMonday = (dayOfWeek(dateKey) + 6) % 7;
  return addDays(dateKey, -daysSinceMonday);
}

/** UTC instants covering one local calendar day: [start, end). */
export function getDayRange(dateKey: DateKey, timeZone: string): { start: Date; end: Date } {
  return {
    start: zonedToUtc(dateKey, 0, timeZone),
    end: zonedToUtc(addDays(dateKey, 1), 0, timeZone),
  };
}

/** 570 → "09:30" */
export function formatMinutes(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

/** "09:30" → 570, or null when the string is not a valid 24h time. */
export function parseTime(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function roundUpToStep(minutes: number, step: number): number {
  return Math.ceil(minutes / step) * step;
}
