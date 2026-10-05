import { TASK_MAX_MINUTES, TASK_MIN_MINUTES, TASK_TITLE_MAX_LENGTH } from "@/features/tasks/constants";
import { addDays, isValidDateKey, parseTime, type DateKey } from "@/lib/utils/zoned-time";
import type { AiPlanResponse } from "../schemas/plan-schemas";
import { PLAN_MAX_TASKS } from "../schemas/plan-schemas";
import type { UnderstoodTask } from "../types";

/** The furthest ahead the planner will put something without asking. */
const MAX_DAYS_AHEAD = 60;
const DEFAULT_MINUTES = 30;

export type NormalizedPlan = {
  summary: string;
  tasks: UnderstoodTask[];
  assumptions: string[];
};

function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MINUTES;
  const roundedToFive = Math.round(value / 5) * 5;
  return Math.min(TASK_MAX_MINUTES, Math.max(TASK_MIN_MINUTES, roundedToFive));
}

/**
 * Business validation for the model's plan. Structural validation already
 * happened; here we enforce product rules and repair what can be repaired:
 * empty titles are dropped, past or invalid dates move to today, durations
 * are clamped, and dependencies may only point at other real tasks.
 */
export function normalizeAiPlan(response: AiPlanResponse, todayKey: DateKey): NormalizedPlan {
  const assumptions = response.assumptions
    .map((assumption) => assumption.trim())
    .filter(Boolean)
    .slice(0, 6);

  const candidates = response.tasks.slice(0, PLAN_MAX_TASKS);
  const keyForIndex = (index: number) => `t${index + 1}`;
  const latestAllowed = addDays(todayKey, MAX_DAYS_AHEAD);
  let movedPastDates = false;

  const tasks: UnderstoodTask[] = [];
  candidates.forEach((candidate, index) => {
    const title = candidate.title.trim().replace(/\s+/g, " ").slice(0, TASK_TITLE_MAX_LENGTH);
    if (!title) return;

    let date = isValidDateKey(candidate.date) ? candidate.date : todayKey;
    if (date < todayKey) {
      date = todayKey;
      movedPastDates = true;
    }
    if (date > latestAllowed) date = latestAllowed;

    const fixedStartMinutes = candidate.startTime ? parseTime(candidate.startTime) : null;
    const dependsOn = candidate.dependsOn
      .filter((dependency) => dependency !== index && dependency >= 0 && dependency < candidates.length)
      .map(keyForIndex);

    tasks.push({
      key: keyForIndex(index),
      title,
      category: candidate.category,
      priority: candidate.priority,
      estimatedMinutes: clampMinutes(candidate.estimatedMinutes),
      date,
      fixedStartMinutes,
      timeOfDay: candidate.timeOfDay,
      dependsOn: Array.from(new Set(dependsOn)),
      notes: candidate.notes?.trim().slice(0, 500) || null,
    });
  });

  // Dependencies on tasks we dropped would otherwise dangle.
  const keptKeys = new Set(tasks.map((task) => task.key));
  for (const task of tasks) task.dependsOn = task.dependsOn.filter((key) => keptKeys.has(key));

  if (movedPastDates) assumptions.push("Some dates were in the past, so I moved those tasks to today.");

  const summary = response.summary.trim().slice(0, 300) || `I've organized ${tasks.length} things for you.`;
  return { summary, tasks, assumptions };
}
