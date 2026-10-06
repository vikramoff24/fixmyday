"use client";

import { AnimatePresence } from "motion/react";
import type { ReactNode } from "react";

import { useClock } from "@/components/providers/clock-provider";
import { Button } from "@/components/ui/button";
import { formatShortDate, formatTimeOfDay } from "@/lib/utils/format";
import { formatMinutes, minutesSinceMidnight } from "@/lib/utils/zoned-time";
import type { Task } from "../types";
import { TaskItem } from "./task-item";

type TaskTimelineProps = {
  scheduled: Task[];
  anytime: Task[];
  overdue: Task[];
  nowMinutes: number;
  selectedId: string | null;
  onSelect: (taskId: string) => void;
  onOpen: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onMoveOverdueToToday: () => void;
};

function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-8 items-center justify-between pl-1 md:pl-2">
      <h2 className="text-[13px] font-medium text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

function NowMarker({ minutes }: { minutes: number }) {
  return (
    <li
      aria-label={`Now, ${formatMinutes(minutes)}`}
      className="flex items-center gap-3 py-1 pl-1 md:gap-4 md:pl-2"
    >
      <span className="w-11 shrink-0 text-right font-mono text-[11px] font-medium text-brand-text tabular-nums md:w-12">
        {formatMinutes(minutes)}
      </span>
      <span aria-hidden className="size-2 shrink-0 rounded-full bg-brand" />
      <span aria-hidden className="h-px flex-1 bg-brand/40" />
    </li>
  );
}

/** Today's tasks in time order, with a live "now" marker and carried-over work. */
export function TaskTimeline({
  scheduled,
  anytime,
  overdue,
  nowMinutes,
  selectedId,
  onSelect,
  onOpen,
  onToggleComplete,
  onMoveOverdueToToday,
}: TaskTimelineProps) {
  const { timeZone } = useClock();

  const renderTask = (task: Task, leading: ReactNode) => (
    <TaskItem
      key={task.id}
      task={task}
      leading={leading}
      isSelected={selectedId === task.id}
      onSelect={() => onSelect(task.id)}
      onOpen={() => onOpen(task)}
      onToggleComplete={() => onToggleComplete(task)}
    />
  );

  // The marker sits before the first task that starts after "now".
  const nowIndex = scheduled.findIndex(
    (task) => task.scheduledStart && minutesSinceMidnight(task.scheduledStart, timeZone) > nowMinutes,
  );
  const markerIndex = nowIndex === -1 ? scheduled.length : nowIndex;

  const timelineItems: ReactNode[] = scheduled.map((task) =>
    renderTask(task, task.scheduledStart ? formatTimeOfDay(task.scheduledStart, timeZone) : "—"),
  );
  timelineItems.splice(markerIndex, 0, <NowMarker key="now" minutes={nowMinutes} />);

  return (
    <div className="flex flex-col gap-8">
      {overdue.length > 0 && (
        <section aria-label="Carried over">
          <SectionHeading
            action={
              <Button variant="ghost" size="sm" onClick={onMoveOverdueToToday}>
                Move all to today
              </Button>
            }
          >
            Carried over
          </SectionHeading>
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {overdue.map((task) => renderTask(task, task.dueDate ? formatShortDate(task.dueDate) : "—"))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {scheduled.length > 0 && (
        <section aria-label="Timeline">
          <SectionHeading>Timeline</SectionHeading>
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>{timelineItems}</AnimatePresence>
          </ul>
        </section>
      )}

      {anytime.length > 0 && (
        <section aria-label="Anytime today">
          <SectionHeading>Anytime today</SectionHeading>
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>{anytime.map((task) => renderTask(task, "—"))}</AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  );
}
