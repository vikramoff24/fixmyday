import "server-only";

import { consumeAiRequest } from "@/lib/ai/rate-limit";
import { generateStructuredOutput, isAiConfigured } from "@/lib/ai/structured-output";
import type { UserClock } from "@/lib/time-zone";
import { addDays, minutesSinceMidnight, zonedToUtc } from "@/lib/utils/zoned-time";
import { ensureUser, getPlanningWindow } from "@/features/settings/services/user-service";
import { findOpenScheduledTasks } from "@/features/tasks/services/task-repository";
import { DEFAULT_TASK_MINUTES } from "@/features/tasks/utils/task-utils";
import type { Task } from "@/features/tasks/types";
import { aiPlanResponseSchema, planDraftSchema, plannerInputSchema } from "../schemas/plan-schemas";
import type { BusyBlock, PlanDraft, UnderstoodTask } from "../types";
import { normalizeAiPlan, type NormalizedPlan } from "../utils/normalize-ai-plan";
import { understandOffline } from "../utils/offline-understanding";
import { schedulePlan } from "../utils/schedule-plan";
import { buildPlannerInput, PLANNER_INSTRUCTIONS } from "./planner-prompt";
import { insertPlanWithTasks } from "./plan-repository";

/** How many days of existing tasks the planner considers when finding free time. */
const PLANNING_HORIZON_DAYS = 7;

async function getBusyBlocks(userId: string, clock: UserClock): Promise<BusyBlock[]> {
  const existing = await findOpenScheduledTasks(
    userId,
    clock.todayKey,
    addDays(clock.todayKey, PLANNING_HORIZON_DAYS),
  );

  return existing.flatMap((task) => {
    if (!task.scheduledStart || !task.dueDate) return [];
    const startMinutes = minutesSinceMidnight(task.scheduledStart, clock.timeZone);
    return [
      {
        date: task.dueDate,
        startMinutes,
        endMinutes: startMinutes + (task.estimatedMinutes ?? DEFAULT_TASK_MINUTES),
        title: task.title,
      },
    ];
  });
}

/**
 * Thoughts → understanding → realistic schedule. Returns a draft only;
 * nothing is saved until the user accepts it.
 */
export async function createPlanDraft(
  userId: string,
  rawInput: string,
  clock: UserClock,
): Promise<PlanDraft> {
  const input = plannerInputSchema.parse(rawInput);
  consumeAiRequest(userId);

  const [window, busy] = await Promise.all([getPlanningWindow(userId), getBusyBlocks(userId, clock)]);

  let understanding: NormalizedPlan;
  let source: PlanDraft["source"];

  if (isAiConfigured()) {
    const response = await generateStructuredOutput({
      name: "plan",
      schema: aiPlanResponseSchema,
      instructions: PLANNER_INSTRUCTIONS,
      input: buildPlannerInput({
        input,
        todayKey: clock.todayKey,
        nowMinutes: clock.nowMinutes,
        window,
        busy,
      }),
    });
    understanding = normalizeAiPlan(response, clock.todayKey);
    source = "ai";
  } else {
    understanding = understandOffline(input, {
      todayKey: clock.todayKey,
      nowMinutes: clock.nowMinutes,
      dayEndMinute: window.dayEndMinute,
    });
    source = "offline";
  }

  const scheduled = schedulePlan(understanding.tasks, {
    window,
    todayKey: clock.todayKey,
    nowMinutes: clock.nowMinutes,
    busy,
  });

  return {
    input,
    summary: understanding.summary,
    tasks: scheduled.tasks,
    assumptions: understanding.assumptions,
    warnings: scheduled.warnings,
    source,
  };
}

/**
 * Re-plans a draft after the user edited it: times the user set stay put,
 * everything else is re-packed by priority around existing commitments.
 */
export async function reorganizePlanDraft(
  userId: string,
  rawDraft: PlanDraft,
  clock: UserClock,
): Promise<PlanDraft> {
  const draft = planDraftSchema.parse(rawDraft);
  const [window, busy] = await Promise.all([getPlanningWindow(userId), getBusyBlocks(userId, clock)]);

  const understood: UnderstoodTask[] = draft.tasks.map((task) => ({
    key: task.key,
    title: task.title,
    category: task.category,
    priority: task.priority,
    estimatedMinutes: task.estimatedMinutes,
    date: task.date < clock.todayKey ? clock.todayKey : task.date,
    fixedStartMinutes: task.isPinned ? task.startMinutes : null,
    timeOfDay: task.timeOfDay,
    dependsOn: task.dependsOn,
    notes: task.notes,
  }));

  const scheduled = schedulePlan(understood, {
    window,
    todayKey: clock.todayKey,
    nowMinutes: clock.nowMinutes,
    busy,
  });

  return { ...draft, tasks: scheduled.tasks, warnings: scheduled.warnings };
}

/** Saves the accepted plan as real tasks. */
export async function acceptPlanDraft(
  userId: string,
  rawDraft: PlanDraft,
  timeZone: string,
): Promise<Task[]> {
  const draft = planDraftSchema.parse(rawDraft);
  await ensureUser(userId);

  return insertPlanWithTasks(
    { userId, input: draft.input, summary: draft.summary },
    draft.tasks.map((task) => ({
      userId,
      title: task.title,
      description: task.notes,
      category: task.category,
      priority: task.priority,
      status: "todo" as const,
      dueDate: task.date,
      scheduledStart: task.startMinutes === null ? null : zonedToUtc(task.date, task.startMinutes, timeZone),
      estimatedMinutes: task.estimatedMinutes,
      tags: [],
    })),
  );
}
