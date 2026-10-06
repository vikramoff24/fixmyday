import { CATEGORY_LABELS, TASK_CATEGORIES, type TaskCategory } from "@/features/tasks/constants";
import type { Task } from "@/features/tasks/types";
import { formatWeekdayLong } from "@/lib/utils/format";
import { addDays, minutesSinceMidnight, startOfWeek, toDateKey, type DateKey } from "@/lib/utils/zoned-time";
import type { Insights } from "../types";

/** How far back patterns (best weekday, best hours) are looked for. */
export const LOOKBACK_WEEKS = 4;
/** Below this many completions, patterns are noise rather than insight. */
const MIN_COMPLETIONS_FOR_PATTERNS = 5;
const MIN_CATEGORY_COMPLETIONS = 3;
/** A time window must hold at least this share of a category's completions. */
const PATTERN_SHARE_THRESHOLD = 0.5;
const WINDOW_HOURS = 2;

type InsightContext = { todayKey: DateKey; timeZone: string };

type Completion = { task: Task; date: DateKey; hour: number };

function formatHour(hour: number): string {
  const suffix = hour >= 12 && hour < 24 ? "PM" : "AM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour} ${suffix}`;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Finds the 2-hour window in which a category's tasks are completed most
 * often. Returns null unless the pattern is strong enough to be useful.
 */
export function findCategoryTimePattern(
  completions: Completion[],
): { category: TaskCategory; startHour: number; share: number } | null {
  let best: { category: TaskCategory; startHour: number; share: number; count: number } | null = null;

  for (const category of TASK_CATEGORIES) {
    const hours = completions.filter((item) => item.task.category === category).map((item) => item.hour);
    if (hours.length < MIN_CATEGORY_COMPLETIONS) continue;

    for (let startHour = 0; startHour < 24; startHour++) {
      const inWindow = hours.filter((hour) => hour >= startHour && hour < startHour + WINDOW_HOURS).length;
      const share = inWindow / hours.length;
      if (
        share >= PATTERN_SHARE_THRESHOLD &&
        (!best || share > best.share || (share === best.share && inWindow > best.count))
      ) {
        best = { category, startHour, share, count: inWindow };
      }
    }
  }

  return best && { category: best.category, startHour: best.startHour, share: best.share };
}

function describeInsight(
  completions: Completion[],
  carriedOver: number,
  mostProductiveDay: string | null,
): string {
  if (completions.length < MIN_COMPLETIONS_FOR_PATTERNS) {
    return "Complete a few more tasks and I'll start spotting patterns in your week.";
  }

  const pattern = findCategoryTimePattern(completions);
  if (pattern) {
    const label = CATEGORY_LABELS[pattern.category].toLowerCase();
    const window = `${formatHour(pattern.startHour)}–${formatHour(pattern.startHour + WINDOW_HOURS)}`;
    return `You tend to complete ${label} tasks most consistently between ${window}. Consider scheduling ${label} work in that window.`;
  }

  if (carriedOver >= 3) {
    return `${carriedOver} tasks slipped past their day recently. Planning a little less per day often means finishing more.`;
  }

  if (mostProductiveDay) {
    return `${mostProductiveDay} is your strongest day. Consider saving your most important work for it.`;
  }

  return "Your week looks balanced. Keep planning the night before to stay ahead.";
}

export function computeInsights(tasks: Task[], { todayKey, timeZone }: InsightContext): Insights {
  const weekStart = startOfWeek(todayKey);
  const weekEnd = addDays(weekStart, 6);
  const lastWeekStart = addDays(weekStart, -7);
  const lookbackStart = addDays(weekStart, -7 * (LOOKBACK_WEEKS - 1));

  const completions: Completion[] = tasks.flatMap((task) => {
    if (task.status !== "completed" || !task.completedAt) return [];
    const date = toDateKey(task.completedAt, timeZone);
    return [{ task, date, hour: Math.floor(minutesSinceMidnight(task.completedAt, timeZone) / 60) }];
  });

  const thisWeekCompletions = completions.filter((item) => item.date >= weekStart && item.date <= weekEnd);
  const lastWeekCompletions = completions.filter(
    (item) => item.date >= lastWeekStart && item.date < weekStart,
  );
  // Compare like with like: this week so far vs. last week up to the same weekday.
  const sameDayLastWeek = addDays(todayKey, -7);
  const lastWeekSoFar = lastWeekCompletions.filter((item) => item.date <= sameDayLastWeek);
  const recentCompletions = completions.filter((item) => item.date >= lookbackStart);

  const dueThisWeek = tasks.filter(
    (task) =>
      task.dueDate && task.dueDate >= weekStart && task.dueDate <= weekEnd && task.status !== "cancelled",
  );
  const completionRate =
    dueThisWeek.length === 0
      ? null
      : Math.round(
          (dueThisWeek.filter((task) => task.status === "completed").length / dueThisWeek.length) * 100,
        );

  const countsByWeekday = new Map<string, number>();
  for (const item of recentCompletions) {
    const weekday = formatWeekdayLong(item.date);
    countsByWeekday.set(weekday, (countsByWeekday.get(weekday) ?? 0) + 1);
  }
  const [topDay] = [...countsByWeekday.entries()].sort((a, b) => b[1] - a[1]);
  const mostProductiveDay =
    recentCompletions.length >= MIN_COMPLETIONS_FOR_PATTERNS && topDay ? topDay[0] : null;

  const durations = recentCompletions
    .map((item) => item.task.estimatedMinutes)
    .filter((minutes): minutes is number => minutes !== null);
  const averageMinutes =
    durations.length === 0
      ? null
      : Math.round(durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length);

  const carriedOver = tasks.filter(
    (task) =>
      task.dueDate &&
      task.dueDate < todayKey &&
      task.dueDate >= lastWeekStart &&
      (task.status === "todo" || task.status === "in_progress"),
  ).length;

  return {
    completedThisWeek: thisWeekCompletions.length,
    completedLastWeek: lastWeekCompletions.length,
    weekOverWeekChange: percentChange(thisWeekCompletions.length, lastWeekSoFar.length),
    completionRate,
    mostProductiveDay,
    averageMinutes,
    thisWeek: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return { date, completed: thisWeekCompletions.filter((item) => item.date === date).length };
    }),
    byCategory: TASK_CATEGORIES.map((category) => ({
      category,
      completed: recentCompletions.filter((item) => item.task.category === category).length,
    }))
      .filter((entry) => entry.completed > 0)
      .sort((a, b) => b.completed - a.completed),
    insight: describeInsight(recentCompletions, carriedOver, mostProductiveDay),
    hasEnoughData: tasks.length > 0,
  };
}
