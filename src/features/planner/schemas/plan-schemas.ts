import { z } from "zod";

import {
  TASK_CATEGORIES,
  TASK_MAX_MINUTES,
  TASK_MIN_MINUTES,
  TASK_PRIORITIES,
} from "@/features/tasks/constants";
import { taskTitleSchema } from "@/features/tasks/schemas/task-schemas";
import { dateKeySchema } from "@/lib/validation/common";
import { MINUTES_PER_DAY } from "@/lib/utils/zoned-time";
import { TIMES_OF_DAY } from "../types";

export const PLANNER_INPUT_MAX_LENGTH = 2000;
export const PLAN_MAX_TASKS = 20;

export const plannerInputSchema = z
  .string()
  .trim()
  .min(3, "Tell me a little more about what's on your mind.")
  .max(PLANNER_INPUT_MAX_LENGTH, "That's a lot! Try splitting it into a few smaller requests.");

/**
 * The structure we ask the model for. It only describes shape — the strict
 * rules (valid dates, sensible durations…) are applied afterwards in
 * `normalizeAiPlan`, so a slightly-off answer is corrected rather than lost.
 */
export const aiPlanResponseSchema = z.object({
  summary: z.string(),
  assumptions: z.array(z.string()),
  tasks: z.array(
    z.object({
      title: z.string(),
      category: z.enum(TASK_CATEGORIES),
      priority: z.enum(TASK_PRIORITIES),
      estimatedMinutes: z.number(),
      date: z.string().describe("Local date, YYYY-MM-DD"),
      startTime: z
        .string()
        .nullable()
        .describe("24h HH:MM, only when the user stated an exact time; otherwise null"),
      timeOfDay: z.enum(TIMES_OF_DAY),
      dependsOn: z.array(z.number().int()).describe("0-based indexes of tasks that must happen first"),
      notes: z.string().nullable(),
    }),
  ),
});

export type AiPlanResponse = z.infer<typeof aiPlanResponseSchema>;

/**
 * A plan draft coming back from the browser (to accept or reorganize). It
 * travelled through the client, so it is validated again from scratch.
 */
export const planTaskDraftSchema = z.object({
  key: z.string().min(1).max(40),
  title: taskTitleSchema,
  category: z.enum(TASK_CATEGORIES),
  priority: z.enum(TASK_PRIORITIES),
  estimatedMinutes: z.number().int().min(TASK_MIN_MINUTES).max(TASK_MAX_MINUTES),
  date: dateKeySchema,
  startMinutes: z
    .number()
    .int()
    .min(0)
    .max(MINUTES_PER_DAY - 1)
    .nullable(),
  isPinned: z.boolean(),
  timeOfDay: z.enum(TIMES_OF_DAY),
  dependsOn: z.array(z.string().max(40)).max(PLAN_MAX_TASKS),
  notes: z.string().trim().max(500).nullable(),
});

export const planDraftSchema = z.object({
  input: plannerInputSchema,
  summary: z.string().trim().max(300),
  tasks: z.array(planTaskDraftSchema).min(1, "There's nothing in this plan yet.").max(PLAN_MAX_TASKS),
  assumptions: z.array(z.string().max(300)).max(10),
  warnings: z.array(z.string().max(300)).max(PLAN_MAX_TASKS + 5),
  source: z.enum(["ai", "offline"]),
});
