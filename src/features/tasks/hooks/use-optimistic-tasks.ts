"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { useClock } from "@/components/providers/clock-provider";
import { deleteTaskAction, rescheduleTaskAction, restoreTaskAction, updateTaskAction } from "../actions";
import type { TaskChanges } from "../schemas/task-schemas";
import type { Task } from "../types";
import { applyTaskChanges } from "../utils/task-patch";
import { isTaskCompleted } from "../utils/task-utils";

type OptimisticChange = { type: "replace"; task: Task } | { type: "remove"; taskId: string };

function reduceTasks(tasks: Task[], change: OptimisticChange): Task[] {
  if (change.type === "remove") return tasks.filter((task) => task.id !== change.taskId);
  return tasks.map((task) => (task.id === change.task.id ? change.task : task));
}

/**
 * Task list with optimistic mutations. Changes appear immediately; when the
 * server action finishes, the refreshed server data takes over. If the action
 * fails, React drops the optimistic state (reverting the UI) and we explain why.
 */
export function useOptimisticTasks(serverTasks: Task[]) {
  const { timeZone } = useClock();
  const [tasks, applyOptimistic] = useOptimistic(serverTasks, reduceTasks);
  const [isPending, startTransition] = useTransition();

  function updateTask(task: Task, changes: TaskChanges) {
    startTransition(async () => {
      applyOptimistic({ type: "replace", task: applyTaskChanges(task, changes, timeZone) });
      const result = await updateTaskAction({ id: task.id, changes });
      if (!result.ok) toast.error(result.error);
    });
  }

  function toggleTaskCompleted(task: Task) {
    const completing = !isTaskCompleted(task);
    updateTask(task, { status: completing ? "completed" : "todo" });
  }

  function rescheduleTask(task: Task, scheduledStart: Date, dueDate: string) {
    startTransition(async () => {
      applyOptimistic({ type: "replace", task: { ...task, scheduledStart, dueDate } });
      const result = await rescheduleTaskAction({ id: task.id, scheduledStart });
      if (result.ok) toast.success("Task moved");
      else toast.error(result.error);
    });
  }

  function deleteTask(task: Task) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", taskId: task.id });
      const result = await deleteTaskAction({ id: task.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast("Task deleted", {
        action: { label: "Undo", onClick: () => restoreTask(result.data) },
      });
    });
  }

  function restoreTask(task: Task) {
    startTransition(async () => {
      const result = await restoreTaskAction({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        scheduledStart: task.scheduledStart,
        estimatedMinutes: task.estimatedMinutes,
        tags: task.tags,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
      });
      if (result.ok) toast.success("Task restored");
      else toast.error(result.error);
    });
  }

  return { tasks, isPending, updateTask, toggleTaskCompleted, rescheduleTask, deleteTask };
}

export type TaskMutations = ReturnType<typeof useOptimisticTasks>;
