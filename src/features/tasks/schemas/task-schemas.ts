import { z } from "zod";

import { dateKeySchema, optionalTextSchema, timeOfDaySchema, uuidSchema } from "@/lib/validation/common";
import {
  TASK_CATEGORIES,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_MAX_MINUTES,
  TASK_MAX_TAGS,
  TASK_MIN_MINUTES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
} from "../constants";

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Give your task a title.")
  .max(TASK_TITLE_MAX_LENGTH, `Keep the title under ${TASK_TITLE_MAX_LENGTH} characters.`);

export const estimatedMinutesSchema = z
  .number()
  .int()
  .min(TASK_MIN_MINUTES, `At least ${TASK_MIN_MINUTES} minutes.`)
  .max(TASK_MAX_MINUTES, "Keep tasks under 12 hours.");

export const tagsSchema = z
  .array(z.string().trim().toLowerCase().min(1).max(32))
  .max(TASK_MAX_TAGS)
  .transform((tags) => Array.from(new Set(tags)));

/** Fields a user can set on a task. Times are local to the user's time zone. */
const taskFieldsSchema = z.object({
  title: taskTitleSchema,
  description: optionalTextSchema(TASK_DESCRIPTION_MAX_LENGTH),
  category: z.enum(TASK_CATEGORIES),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  dueDate: dateKeySchema.nullable(),
  /** Local start time. Requires `dueDate`. */
  startTime: timeOfDaySchema.nullable(),
  estimatedMinutes: estimatedMinutesSchema.nullable(),
  tags: tagsSchema,
});

function startTimeNeedsDate(value: { dueDate?: string | null; startTime?: string | null }) {
  return !value.startTime || Boolean(value.dueDate);
}

const startTimeNeedsDateIssue = { message: "Pick a date for the start time.", path: ["dueDate"] };

export const createTaskInputSchema = taskFieldsSchema
  .partial({
    description: true,
    status: true,
    dueDate: true,
    startTime: true,
    estimatedMinutes: true,
    tags: true,
  })
  .refine(startTimeNeedsDate, startTimeNeedsDateIssue);

export type CreateTaskInput = z.input<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: uuidSchema,
  changes: taskFieldsSchema
    .partial()
    .refine((changes) => changes.startTime === undefined || changes.dueDate !== undefined, {
      message: "Send the date together with the start time.",
      path: ["dueDate"],
    }),
});

export type UpdateTaskInput = z.input<typeof updateTaskInputSchema>;
export type TaskChanges = z.output<typeof updateTaskInputSchema>["changes"];

export const taskIdInputSchema = z.object({ id: uuidSchema });

/** Restoring a deleted task re-creates it with its original id and history. */
export const restoreTaskInputSchema = taskFieldsSchema.omit({ startTime: true }).extend({
  id: uuidSchema,
  scheduledStart: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export type RestoreTaskInput = z.input<typeof restoreTaskInputSchema>;
