import "server-only";

import { findTasksSince } from "@/features/tasks/services/task-repository";
import type { UserClock } from "@/lib/time-zone";
import { addDays, startOfWeek, zonedToUtc } from "@/lib/utils/zoned-time";
import type { Insights } from "../types";
import { computeInsights, LOOKBACK_WEEKS } from "../utils/compute-insights";

export async function getInsights(userId: string, clock: UserClock): Promise<Insights> {
  // One extra week so "last week" comparisons are always complete.
  const sinceDate = addDays(startOfWeek(clock.todayKey), -7 * LOOKBACK_WEEKS);
  const tasks = await findTasksSince(userId, zonedToUtc(sinceDate, 0, clock.timeZone), sinceDate);
  return computeInsights(tasks, { todayKey: clock.todayKey, timeZone: clock.timeZone });
}
