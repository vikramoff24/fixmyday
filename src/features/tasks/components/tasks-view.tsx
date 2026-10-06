"use client";

import { Plus, SearchX } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";

import { useAppShell } from "@/components/layout/app-shell-context";
import { useClock } from "@/components/providers/clock-provider";
import { StateMessage } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatShortDate, formatTimeOfDay } from "@/lib/utils/format";
import { useOptimisticTasks } from "../hooks/use-optimistic-tasks";
import { useTaskFilterParams } from "../hooks/use-task-filter-params";
import { useTaskListNavigation } from "../hooks/use-task-list-navigation";
import { DEFAULT_TASK_FILTERS, type TaskFilters } from "../schemas/task-filters";
import type { Task } from "../types";
import { groupTasksByDay, type TaskGroup } from "../utils/group-tasks";
import { TaskDetailPanel } from "./task-detail-panel";
import { TaskFiltersBar } from "./task-filters-bar";
import { TaskItem } from "./task-item";

type TasksViewProps = {
  tasks: Task[];
  filters: TaskFilters;
  autoFocusSearch: boolean;
};

function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.q !== "" ||
    filters.category !== undefined ||
    filters.priority !== undefined ||
    filters.view !== DEFAULT_TASK_FILTERS.view
  );
}

export function TasksView({ tasks: serverTasks, filters, autoFocusSearch }: TasksViewProps) {
  const { timeZone, todayKey } = useClock();
  const { openNewTask } = useAppShell();
  const { setFilters, clearFilters, isPending } = useTaskFilterParams();
  const { tasks, updateTask, toggleTaskCompleted, deleteTask } = useOptimisticTasks(serverTasks);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const groups: TaskGroup[] =
    filters.sort === "schedule" ? groupTasksByDay(tasks, todayKey) : [{ id: "all", label: "", tasks }];
  const visibleOrder = groups.flatMap((group) => group.tasks);
  const openTask = tasks.find((task) => task.id === openTaskId) ?? null;

  const { selectedId, setSelectedId } = useTaskListNavigation({
    tasks: visibleOrder,
    onToggleComplete: toggleTaskCompleted,
    onOpen: (task) => setOpenTaskId(task.id),
  });

  function leadingFor(task: Task): string {
    // Within a day group the date is in the heading, so show the time.
    if (filters.sort === "schedule" && task.dueDate && task.dueDate >= todayKey) {
      return task.scheduledStart ? formatTimeOfDay(task.scheduledStart, timeZone) : "—";
    }
    return task.dueDate ? formatShortDate(task.dueDate) : "—";
  }

  const countLabel = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-8 pb-16 md:px-8 md:pt-14">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Tasks</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">{countLabel}</p>
        </div>
        <Button onClick={openNewTask} size="sm">
          <Plus />
          New task
        </Button>
      </header>

      <TaskFiltersBar filters={filters} autoFocusSearch={autoFocusSearch} onChange={setFilters} />

      <div className={cn("transition-opacity duration-200", isPending && "opacity-60")} aria-busy={isPending}>
        {tasks.length === 0 ? (
          hasActiveFilters(filters) ? (
            <StateMessage
              icon={<SearchX className="size-[18px] text-muted-foreground" />}
              title="No tasks match."
              description="Try a different search or clear the filters."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <StateMessage
              title="No tasks yet."
              description="Add one yourself, or tell the planner what's on your mind."
              action={
                <Button variant="brand" size="sm" onClick={openNewTask}>
                  <Plus />
                  New task
                </Button>
              }
            />
          )
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.id} aria-label={group.label || "Tasks"}>
                {group.label && (
                  <h2
                    className={cn(
                      "flex h-8 items-center pl-1 text-[13px] font-medium md:pl-2",
                      group.id === "overdue" ? "text-prio-urgent" : "text-muted-foreground",
                    )}
                  >
                    {group.label}
                  </h2>
                )}
                <ul className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {group.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        leading={leadingFor(task)}
                        isSelected={selectedId === task.id}
                        onSelect={() => setSelectedId(task.id)}
                        onOpen={() => setOpenTaskId(task.id)}
                        onToggleComplete={() => toggleTaskCompleted(task)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <TaskDetailPanel
        task={openTask}
        onClose={() => setOpenTaskId(null)}
        onUpdate={updateTask}
        onToggleComplete={toggleTaskCompleted}
        onDelete={deleteTask}
      />
    </div>
  );
}
