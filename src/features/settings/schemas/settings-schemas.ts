import { z } from "zod";

import { timeOfDaySchema } from "@/lib/validation/common";
import { parseTime } from "@/lib/utils/zoned-time";

export type PlanningWindow = {
  /** Minutes after local midnight. */
  dayStartMinute: number;
  dayEndMinute: number;
};

export const DEFAULT_PLANNING_WINDOW: PlanningWindow = {
  dayStartMinute: 9 * 60,
  dayEndMinute: 22 * 60,
};

const MIN_WINDOW_MINUTES = 2 * 60;

export const planningWindowFormSchema = z
  .object({ dayStart: timeOfDaySchema, dayEnd: timeOfDaySchema })
  .refine(
    ({ dayStart, dayEnd }) => (parseTime(dayEnd) ?? 0) - (parseTime(dayStart) ?? 0) >= MIN_WINDOW_MINUTES,
    { message: "Your day should be at least 2 hours long.", path: ["dayEnd"] },
  );

export type PlanningWindowForm = z.infer<typeof planningWindowFormSchema>;
