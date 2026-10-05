import "server-only";
import { cookies } from "next/headers";

import { TIME_ZONE_COOKIE } from "@/config/cookies";
import { isValidTimeZone, minutesSinceMidnight, toDateKey, type DateKey } from "@/lib/utils/zoned-time";

export const DEFAULT_TIME_ZONE = "UTC";

/**
 * The user's time zone as reported by their browser. Cookie values are
 * untrusted input, so anything Intl doesn't recognise falls back to UTC.
 */
export async function getRequestTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  const value = cookieStore.get(TIME_ZONE_COOKIE)?.value;
  if (value && isValidTimeZone(value)) return value;
  return DEFAULT_TIME_ZONE;
}

export type UserClock = {
  timeZone: string;
  now: Date;
  todayKey: DateKey;
  nowMinutes: number;
};

/** "Now", expressed in the user's time zone. */
export async function getUserClock(): Promise<UserClock> {
  const timeZone = await getRequestTimeZone();
  const now = new Date();
  return {
    timeZone,
    now,
    todayKey: toDateKey(now, timeZone),
    nowMinutes: minutesSinceMidnight(now, timeZone),
  };
}
