import { parseTime, zonedToUtc } from "@/lib/utils/zoned-time";
import type { TaskChanges } from "../schemas/task-schemas";
import type { Task } from "../types";
import { getCompletedAtForStatus } from "./task-utils";

/**
 * Predicts how a task will look after `changes` are saved, so the UI can
 * update instantly. The server remains the source of truth and replaces this
 * prediction as soon as it responds.
 */
export function applyTaskChanges(task: Task, changes: TaskChanges, timeZone: string, now = new Date()): Task {
  const next: Task = { ...task, updatedAt: now };

  if (changes.title !== undefined) next.title = changes.title;
  if (changes.description !== undefined) next.description = changes.description;
  if (changes.category !== undefined) next.category = changes.category;
  if (changes.priority !== undefined) next.priority = changes.priority;
  if (changes.estimatedMinutes !== undefined) next.estimatedMinutes = changes.estimatedMinutes;
  if (changes.tags !== undefined) next.tags = changes.tags;

  if (changes.status !== undefined) {
    next.status = changes.status;
    next.completedAt = getCompletedAtForStatus(changes.status, task.completedAt, now);
  }

  if (changes.dueDate !== undefined) {
    next.dueDate = changes.dueDate;
    if (changes.startTime !== undefined) {
      const minutes = changes.startTime ? parseTime(changes.startTime) : null;
      next.scheduledStart =
        changes.dueDate && minutes !== null ? zonedToUtc(changes.dueDate, minutes, timeZone) : null;
    } else if (!changes.dueDate) {
      next.scheduledStart = null;
    }
  }

  return next;
}
