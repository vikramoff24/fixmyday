import { formatLongDate, formatRelativeDay } from "@/lib/utils/format";
import type { DateKey } from "@/lib/utils/zoned-time";
import type { Task } from "../types";

export type TaskGroup = { id: string; label: string; tasks: Task[] };

/**
 * Groups tasks (already sorted by date) into readable sections:
 * Overdue, Today, Tomorrow, then one section per later day, then No date.
 */
export function groupTasksByDay(tasks: Task[], todayKey: DateKey): TaskGroup[] {
  const groups = new Map<string, TaskGroup>();

  function add(id: string, label: string, task: Task) {
    const group = groups.get(id) ?? { id, label, tasks: [] };
    group.tasks.push(task);
    groups.set(id, group);
  }

  for (const task of tasks) {
    if (!task.dueDate) add("no-date", "No date", task);
    else if (task.dueDate < todayKey && task.status !== "completed") add("overdue", "Overdue", task);
    else {
      const relative = formatRelativeDay(task.dueDate, todayKey);
      const isNamedDay = ["Today", "Tomorrow", "Yesterday"].includes(relative);
      add(
        task.dueDate,
        isNamedDay ? `${relative} · ${formatLongDate(task.dueDate)}` : formatLongDate(task.dueDate),
        task,
      );
    }
  }

  const ordered = [...groups.values()];
  // Overdue first, undated last; dated groups keep their (sorted) order.
  return [
    ...ordered.filter((group) => group.id === "overdue"),
    ...ordered.filter((group) => group.id !== "overdue" && group.id !== "no-date"),
    ...ordered.filter((group) => group.id === "no-date"),
  ];
}
