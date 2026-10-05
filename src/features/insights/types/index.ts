import type { TaskCategory } from "@/features/tasks/constants";
import type { DateKey } from "@/lib/utils/zoned-time";

export type DailyCount = { date: DateKey; completed: number };
export type CategoryCount = { category: TaskCategory; completed: number };

export type Insights = {
  completedThisWeek: number;
  completedLastWeek: number;
  /** Change vs. last week at the same point (e.g. Mon–Wed vs Mon–Wed), or null with nothing to compare. */
  weekOverWeekChange: number | null;
  /** Share of this week's due tasks that are done (0–100), or null with no due tasks. */
  completionRate: number | null;
  /** Weekday name with the most completions over the lookback window. */
  mostProductiveDay: string | null;
  averageMinutes: number | null;
  thisWeek: DailyCount[];
  byCategory: CategoryCount[];
  insight: string;
  hasEnoughData: boolean;
};
