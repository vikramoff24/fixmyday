import "server-only";

import { NotFoundError } from "@/lib/errors";
import {
  formatMinutes,
  minutesSinceMidnight,
  parseTime,
  toDateKey,
  zonedToUtc,
  type DateKey,
} from "@/lib/utils/zoned-time";
import { ensureUser } from "@/features/settings/services/user-service";
import type { NewTaskRow } from "@/lib/db/schema";
import {
  createTaskInputSchema,
  restoreTaskInputSchema,
  updateTaskInputSchema,
  type CreateTaskInput,
  type RestoreTaskInput,
  type UpdateTaskInput,
} from "../schemas/task-schemas";
import type { TaskFilters } from "../schemas/task-filters";
import type { Task } from "../types";
import { getCompletedAtForStatus } from "../utils/task-utils";
import * as taskRepository from "./task-repository";

/**
 * Business rules for tasks. Inputs are validated here (not only in the UI)
 * because services are the last line before the database.
 */

function toScheduledStart(dueDate: DateKey | null, startTime: string | null, timeZone: string): Date | null {
  if (!dueDate || !startTime) return null;
  const minutes = parseTime(startTime);
  return minutes === null ? null : zonedToUtc(dueDate, minutes, timeZone);
}

export async function createTask(userId: string, input: CreateTaskInput, timeZone: string): Promise<Task> {
  const data = createTaskInputSchema.parse(input);
  const dueDate = data.dueDate ?? null;
  const status = data.status ?? "todo";
  const now = new Date();

  await ensureUser(userId);
  const [task] = await taskRepository.insertTasks([
    {
      userId,
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      priority: data.priority,
      status,
      dueDate,
      scheduledStart: toScheduledStart(dueDate, data.startTime ?? null, timeZone),
      estimatedMinutes: data.estimatedMinutes ?? null,
      tags: data.tags ?? [],
      completedAt: getCompletedAtForStatus(status, null, now),
    },
  ]);
  return task;
}

export async function updateTask(userId: string, input: UpdateTaskInput, timeZone: string): Promise<Task> {
  const { id, changes } = updateTaskInputSchema.parse(input);
  const existing = await taskRepository.findTaskById(userId, id);
  if (!existing) throw new NotFoundError("task");

  const values: Partial<NewTaskRow> = {};
  if (changes.title !== undefined) values.title = changes.title;
  if (changes.description !== undefined) values.description = changes.description;
  if (changes.category !== undefined) values.category = changes.category;
  if (changes.priority !== undefined) values.priority = changes.priority;
  if (changes.estimatedMinutes !== undefined) values.estimatedMinutes = changes.estimatedMinutes;
  if (changes.tags !== undefined) values.tags = changes.tags;

  if (changes.status !== undefined) {
    values.status = changes.status;
    values.completedAt = getCompletedAtForStatus(changes.status, existing.completedAt, new Date());
  }

  if (changes.dueDate !== undefined) {
    values.dueDate = changes.dueDate;
    // Date and time travel together so the stored instant always matches the day.
    const startTime =
      changes.startTime !== undefined ? changes.startTime : keepExistingStartTime(existing, timeZone);
    values.scheduledStart = toScheduledStart(changes.dueDate, startTime, timeZone);
  }

  const updated = await taskRepository.updateTaskRow(userId, id, values);
  if (!updated) throw new NotFoundError("task");
  return updated;
}

function keepExistingStartTime(task: Task, timeZone: string): string | null {
  if (!task.scheduledStart) return null;
  return formatMinutes(minutesSinceMidnight(task.scheduledStart, timeZone));
}

/** Moves a task to an exact local time. Used by calendar drag-and-drop. */
export async function rescheduleTask(
  userId: string,
  taskId: string,
  scheduledStart: Date,
  timeZone: string,
): Promise<Task> {
  const updated = await taskRepository.updateTaskRow(userId, taskId, {
    scheduledStart,
    dueDate: toDateKey(scheduledStart, timeZone),
  });
  if (!updated) throw new NotFoundError("task");
  return updated;
}

export async function deleteTask(userId: string, taskId: string): Promise<Task> {
  const deleted = await taskRepository.deleteTaskRow(userId, taskId);
  if (!deleted) throw new NotFoundError("task");
  return deleted;
}

/** Undo for delete: re-creates the task with its original id and history. */
export async function restoreTask(userId: string, input: RestoreTaskInput): Promise<Task> {
  const data = restoreTaskInputSchema.parse(input);
  await ensureUser(userId);
  const [task] = await taskRepository.insertTasks([{ ...data, userId }]);
  return task;
}

export async function getTasksForDay(userId: string, dateKey: DateKey): Promise<Task[]> {
  return taskRepository.findTasksForDates(userId, dateKey, dateKey);
}

export async function getTasksForDates(userId: string, from: DateKey, to: DateKey): Promise<Task[]> {
  return taskRepository.findTasksForDates(userId, from, to);
}

export async function getOverdueTasks(userId: string, todayKey: DateKey): Promise<Task[]> {
  return taskRepository.findOverdueTasks(userId, todayKey);
}

export async function searchTasks(userId: string, filters: TaskFilters): Promise<Task[]> {
  return taskRepository.findTasksMatching(userId, filters);
}
