import type { Task } from "@/features/tasks/types";
import { formatTimeOfDay } from "@/lib/utils/format";

/** A task as shown to the assistant, under a short reference like "T3". */
export type ContextTask = { ref: string; task: Task };

export function buildContextTasks(tasks: Task[]): ContextTask[] {
  return tasks.map((task, index) => ({ ref: `T${index + 1}`, task }));
}

export function describeContextTask({ ref, task }: ContextTask, timeZone: string): string {
  const time = task.scheduledStart ? formatTimeOfDay(task.scheduledStart, timeZone) : "anytime";
  const duration = task.estimatedMinutes ? `${task.estimatedMinutes} min` : "duration unknown";
  return `${ref}: "${task.title}" — ${task.dueDate ?? "no date"} ${time}, ${duration}, ${task.priority} priority, ${task.category}, ${task.status}`;
}
