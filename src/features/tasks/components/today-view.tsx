"use client";

import { useState } from "react";

import { useAppShell } from "@/components/layout/app-shell-context";
import { useClock } from "@/components/providers/clock-provider";
import { StateMessage } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { PlannerPanel } from "@/features/planner/components/planner-panel";
import { MOBILE_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import { useNowMinutes } from "@/hooks/use-now-minutes";
import { formatLongDate, getGreeting } from "@/lib/utils/format";
import { formatMinutes, minutesSinceMidnight } from "@/lib/utils/zoned-time";
import { useOptimisticTasks } from "../hooks/use-optimistic-tasks";
import { useTaskListNavigation } from "../hooks/use-task-list-navigation";
import type { Task } from "../types";
import { calculateDailyProgress, sortTasksForTimeline } from "../utils/task-utils";
import { DailyProgress } from "./daily-progress";
import { TaskDetailPanel } from "./task-detail-panel";
import { TaskTimeline } from "./task-timeline";

type TodayViewProps = {
  /** Today's tasks plus unfinished tasks from earlier days. */
  tasks: Task[];
  initialNowMinutes: number;
};

export function TodayView({ tasks: serverTasks, initialNowMinutes }: TodayViewProps) {
  const { timeZone, todayKey } = useClock();
  const { openPlanner } = useAppShell();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const nowMinutes = useNowMinutes(initialNowMinutes, timeZone);
  const { tasks, updateTask, toggleTaskCompleted, deleteTask } = useOptimisticTasks(serverTasks);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const sorted = sortTasksForTimeline(tasks);
  const overdue = sorted.filter((task) => task.dueDate !== null && task.dueDate < todayKey);
  const todays = sorted.filter((task) => task.dueDate === todayKey);
  const scheduled = todays.filter((task) => task.scheduledStart !== null);
  const anytime = todays.filter((task) => task.scheduledStart === null);
  const orderedForKeyboard = [...overdue, ...scheduled, ...anytime];

  const openTask = tasks.find((task) => task.id === openTaskId) ?? null;
  const { selectedId, setSelectedId } = useTaskListNavigation({
    tasks: orderedForKeyboard,
    onToggleComplete: toggleTaskCompleted,
    onOpen: (task) => setOpenTaskId(task.id),
  });

  function moveOverdueToToday() {
    for (const task of overdue) {
      const startTime = task.scheduledStart
        ? formatMinutes(minutesSinceMidnight(task.scheduledStart, timeZone))
        : null;
      updateTask(task, { dueDate: todayKey, startTime });
    }
  }

  function startPlanning() {
    if (isMobile) openPlanner();
    else document.getElementById("planner-input")?.focus();
  }

  const hasTasks = todays.length > 0 || overdue.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pt-8 pb-16 md:px-8 md:pt-14">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">{getGreeting(nowMinutes)}</h1>
        <p className="text-[15px] text-muted-foreground">
          Here&apos;s your plan for {formatLongDate(todayKey)}.
        </p>
      </header>

      <PlannerPanel className="hidden md:flex" />

      {hasTasks ? (
        <>
          {todays.length > 0 && <DailyProgress progress={calculateDailyProgress(todays)} />}
          <TaskTimeline
            scheduled={scheduled}
            anytime={anytime}
            overdue={overdue}
            nowMinutes={nowMinutes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onOpen={(task) => setOpenTaskId(task.id)}
            onToggleComplete={toggleTaskCompleted}
            onMoveOverdueToToday={moveOverdueToToday}
          />
        </>
      ) : (
        <StateMessage
          title="Nothing planned yet."
          description="Tell me what's on your mind and I'll organize your day."
          action={
            <Button variant="brand" onClick={startPlanning}>
              Start planning
            </Button>
          }
        />
      )}

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
