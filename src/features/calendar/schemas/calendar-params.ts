import { z } from "zod";

import { dateKeySchema } from "@/lib/validation/common";
import type { DateKey } from "@/lib/utils/zoned-time";

export const CALENDAR_VIEWS = ["day", "week"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

const calendarParamsSchema = z.object({
  view: z.enum(CALENDAR_VIEWS).catch("week"),
  date: dateKeySchema.optional().catch(undefined),
});

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseCalendarParams(
  searchParams: RawSearchParams,
  todayKey: DateKey,
): { view: CalendarView; date: DateKey } {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const parsed = calendarParamsSchema.parse({
    view: first(searchParams.view),
    date: first(searchParams.date),
  });
  return { view: parsed.view, date: parsed.date ?? todayKey };
}
