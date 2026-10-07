"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAppShell } from "@/components/layout/app-shell-context";
import { useClock } from "@/components/providers/clock-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskDetailPanel } from "@/features/tasks/components/task-detail-panel";
import { useOptimisticTasks } from "@/features/tasks/hooks/use-optimistic-tasks";
import type { Task } from "@/features/tasks/types";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, formatShortDate } from "@/lib/utils/format";
import { zonedToUtc, type DateKey } from "@/lib/utils/zoned-time";
import { CALENDAR_VIEWS, type CalendarView as CalendarViewMode } from "../schemas/calendar-params";
import { getVisibleDays, shiftCalendarDate } from "../utils/calendar-layout";
import { CalendarGrid } from "./calendar-grid";

type CalendarViewProps = {
  view: CalendarViewMode;
  date: DateKey;
  tasks: Task[];
  initialNowMinutes: number;
};

function calendarHref(view: CalendarViewMode, date: DateKey) {
  return `/calendar?view=${view}&date=${date}`;
}

function rangeLabel(view: CalendarViewMode, days: DateKey[]): string {
  if (view === "day") return formatLongDate(days[0]);
  const year = days[6].slice(0, 4);
  return `${formatShortDate(days[0])} – ${formatShortDate(days[6])}, ${year}`;
}

export function CalendarView({ view, date, tasks: serverTasks, initialNowMinutes }: CalendarViewProps) {
  const { timeZone, todayKey } = useClock();
  const { openNewTask } = useAppShell();
  const { tasks, updateTask, toggleTaskCompleted, rescheduleTask, deleteTask } =
    useOptimisticTasks(serverTasks);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const router = useRouter();
  const [jumpOpen, setJumpOpen] = useState(false);

  const days = getVisibleDays(view, date);
  const showsToday = days.includes(todayKey);
  const openTask = tasks.find((task) => task.id === openTaskId) ?? null;

  function handleMove(task: Task, targetDate: DateKey, startMinutes: number) {
    rescheduleTask(task, zonedToUtc(targetDate, startMinutes, timeZone), targetDate);
  }

  return (
    <div className="flex w-full flex-col gap-5 px-4 pt-8 pb-6 md:px-8 md:pt-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Calendar</h1>
          <Popover open={jumpOpen} onOpenChange={setJumpOpen}>
            <PopoverTrigger
              aria-label={`${rangeLabel(view, days)}. Jump to a date`}
              className="group mt-1 -ml-1.5 flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[15px] text-muted-foreground transition-colors hover:bg-hover hover:text-foreground data-[state=open]:bg-hover data-[state=open]:text-foreground"
            >
              <span className="tabular-nums">{rangeLabel(view, days)}</span>
              <ChevronDown
                aria-hidden
                className="size-4 text-subtle-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-3">
              <Calendar
                value={date}
                today={todayKey}
                highlighted={view === "week" ? days : undefined}
                autoFocus
                onSelect={(next) => {
                  setJumpOpen(false);
                  router.push(calendarHref(view, next));
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Calendar view"
            className="flex rounded-lg border border-border bg-hover p-0.5"
          >
            {CALENDAR_VIEWS.map((mode) => (
              <Link
                key={mode}
                role="tab"
                aria-selected={mode === view}
                href={calendarHref(mode, date)}
                className={cn(
                  "relative flex h-7 items-center rounded-md px-3 text-[13px] font-medium capitalize transition-colors",
                  mode === view ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === view && (
                  <motion.span
                    layoutId="calendar-view-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-md bg-card shadow-sm dark:bg-selected"
                  />
                )}
                <span className="relative">{mode}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button asChild variant="ghost" size="icon-sm" className="size-7">
              <Link
                href={calendarHref(view, shiftCalendarDate(view, date, -1))}
                aria-label={`Previous ${view}`}
              >
                <ChevronLeft />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2.5", showsToday && "text-foreground")}
            >
              <Link href={calendarHref(view, todayKey)} aria-current={showsToday ? "date" : undefined}>
                Today
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon-sm" className="size-7">
              <Link href={calendarHref(view, shiftCalendarDate(view, date, 1))} aria-label={`Next ${view}`}>
                <ChevronRight />
              </Link>
            </Button>
          </div>

          <Button size="sm" onClick={openNewTask} className="hidden sm:inline-flex">
            <Plus />
            New task
          </Button>
        </div>
      </header>

      <CalendarGrid
        key={`${view}-${days[0]}`}
        days={days}
        tasks={tasks}
        initialNowMinutes={initialNowMinutes}
        onMove={handleMove}
        onOpen={(task) => setOpenTaskId(task.id)}
      />

      <p className="hidden text-xs text-subtle-foreground md:block">
        Drag a task to reschedule it, or focus it and use the arrow keys.
      </p>

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
