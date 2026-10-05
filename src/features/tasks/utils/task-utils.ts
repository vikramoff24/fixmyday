import { PRIORITY_RANK, type TaskStatus } from "../constants";
import type { DailyProgress, Task } from "../types";

export function isTaskCompleted(task: Pick<Task, "status">): boolean {
  return task.status === "completed";
}

export function isTaskOpen(task: Pick<Task, "status">): boolean {
  return task.status === "todo" || task.status === "in_progress";
}

/** Cancelled tasks don't count towards the day — they were never going to happen. */
export function calculateDailyProgress(tasks: Pick<Task, "status">[]): DailyProgress {
  const countable = tasks.filter((task) => task.status !== "cancelled");
  const completed = countable.filter(isTaskCompleted).length;
  const total = countable.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

type SortableTask = Pick<Task, "scheduledStart" | "priority" | "createdAt">;

/**
 * Timeline order: scheduled tasks by start time, then unscheduled tasks by
 * priority (most important first), then by creation time.
 */
export function compareTasksForTimeline(a: SortableTask, b: SortableTask): number {
  if (a.scheduledStart && b.scheduledStart) {
    return a.scheduledStart.getTime() - b.scheduledStart.getTime();
  }
  if (a.scheduledStart) return -1;
  if (b.scheduledStart) return 1;

  const priorityDifference = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (priorityDifference !== 0) return priorityDifference;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

export function sortTasksForTimeline<T extends SortableTask>(tasks: T[]): T[] {
  return [...tasks].sort(compareTasksForTimeline);
}

/** Keeps `completedAt` consistent with the status a task is moving to. */
export function getCompletedAtForStatus(
  nextStatus: TaskStatus,
  currentCompletedAt: Date | null,
  now: Date,
): Date | null {
  if (nextStatus !== "completed") return null;
  return currentCompletedAt ?? now;
}

/** End of a scheduled task, assuming a default length when none was estimated. */
export const DEFAULT_TASK_MINUTES = 30;

export function getTaskEnd(task: Pick<Task, "scheduledStart" | "estimatedMinutes">): Date | null {
  if (!task.scheduledStart) return null;
  const minutes = task.estimatedMinutes ?? DEFAULT_TASK_MINUTES;
  return new Date(task.scheduledStart.getTime() + minutes * 60_000);
}
