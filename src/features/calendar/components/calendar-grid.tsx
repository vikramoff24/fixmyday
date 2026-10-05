"use client";

import { useEffect, useRef } from "react";

import { useClock } from "@/components/providers/clock-provider";
import { categoryDotClass } from "@/features/tasks/components/task-meta";
import type { Task } from "@/features/tasks/types";
import { DEFAULT_TASK_MINUTES } from "@/features/tasks/utils/task-utils";
import { useNowMinutes } from "@/hooks/use-now-minutes";
import { cn } from "@/lib/utils/cn";
import { formatWeekdayShort } from "@/lib/utils/format";
import { formatMinutes, minutesSinceMidnight, type DateKey } from "@/lib/utils/zoned-time";
import type { BlockPosition } from "../hooks/use-block-drag";
import { layoutDayBlocks, MIN_BLOCK_MINUTES } from "../utils/calendar-layout";
import { CalendarBlock } from "./calendar-block";

const HOUR_HEIGHT = 52;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
/** Scroll so the morning is in view when the calendar opens. */
const INITIAL_SCROLL_HOUR = 7;

type CalendarGridProps = {
  days: DateKey[];
  tasks: Task[];
  initialNowMinutes: number;
  onMove: (task: Task, date: DateKey, startMinutes: number) => void;
  onOpen: (task: Task) => void;
};

export function CalendarGrid({ days, tasks, initialNowMinutes, onMove, onOpen }: CalendarGridProps) {
  const { timeZone, todayKey } = useClock();
  const nowMinutes = useNowMinutes(initialNowMinutes, timeZone);
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A little less than the full hour so its label clears the sticky header.
    scrollRef.current?.scrollTo({ top: INITIAL_SCROLL_HOUR * HOUR_HEIGHT - 16 });
  }, []);

  const scheduledByDay = new Map<DateKey, Task[]>();
  const anytimeByDay = new Map<DateKey, Task[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const target = task.scheduledStart ? scheduledByDay : anytimeByDay;
    target.set(task.dueDate, [...(target.get(task.dueDate) ?? []), task]);
  }
  const hasAnytime = anytimeByDay.size > 0;

  const gridColumns = {
    gridTemplateColumns: `repeat(${days.length}, minmax(${days.length > 1 ? 104 : 0}px, 1fr))`,
  };

  function handleMove(task: Task, position: BlockPosition) {
    onMove(task, days[position.dayIndex], position.startMinutes);
  }

  return (
    <div
      ref={scrollRef}
      className="relative h-[calc(100dvh-13rem)] overflow-auto rounded-xl border border-border bg-card/40 md:h-[calc(100dvh-10.5rem)]"
    >
      <div className="min-w-fit">
        {/* Sticky day headers and the "anytime" row. */}
        <div className="sticky top-0 z-40 flex border-b border-border bg-background/95 backdrop-blur">
          <div className="w-14 shrink-0" />
          <div className="grid flex-1" style={gridColumns}>
            {days.map((day) => {
              const isToday = day === todayKey;
              return (
                <div
                  key={day}
                  className="flex flex-col gap-1.5 border-l border-border px-2 py-2.5 first:border-l-0"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-muted-foreground">{formatWeekdayShort(day)}</span>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isToday && "rounded-md bg-brand px-1.5 text-brand-foreground",
                      )}
                    >
                      {Number(day.slice(8))}
                    </span>
                  </div>
                  {hasAnytime && (
                    <div className="flex min-h-6 flex-col gap-1">
                      {(anytimeByDay.get(day) ?? []).slice(0, 3).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onOpen(task)}
                          className="flex h-6 cursor-pointer items-center gap-1.5 truncate rounded bg-hover px-1.5 text-left text-[11px] font-medium hover:bg-selected"
                        >
                          <span
                            aria-hidden
                            className={cn("size-1.5 shrink-0 rounded-full", categoryDotClass[task.category])}
                          />
                          <span className="truncate">{task.title}</span>
                        </button>
                      ))}
                      {(anytimeByDay.get(day)?.length ?? 0) > 3 && (
                        <span className="px-1.5 text-[11px] text-subtle-foreground">
                          +{(anytimeByDay.get(day)?.length ?? 0) - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="relative w-14 shrink-0" aria-hidden>
            {HOURS.slice(1).map((hour) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-1/2 font-mono text-[11px] text-subtle-foreground tabular-nums"
                style={{ top: hour * HOUR_HEIGHT }}
              >
                {formatMinutes(hour * 60)}
              </span>
            ))}
          </div>

          <div
            className="grid flex-1"
            style={{
              ...gridColumns,
              backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR_HEIGHT}px)`,
            }}
          >
            {days.map((day, dayIndex) => {
              const dayTasks = scheduledByDay.get(day) ?? [];
              const blocks = dayTasks.flatMap((task) =>
                task.scheduledStart
                  ? [
                      {
                        task,
                        start: minutesSinceMidnight(task.scheduledStart, timeZone),
                        duration: task.estimatedMinutes ?? DEFAULT_TASK_MINUTES,
                      },
                    ]
                  : [],
              );
              const layout = layoutDayBlocks(
                blocks.map((block) => ({
                  id: block.task.id,
                  start: block.start,
                  end: block.start + Math.max(block.duration, MIN_BLOCK_MINUTES),
                })),
              );

              return (
                <div
                  key={day}
                  ref={dayIndex === 0 ? columnRef : undefined}
                  className={cn(
                    "relative border-l border-border first:border-l-0",
                    day === todayKey && "bg-brand-soft/30",
                  )}
                >
                  {day === todayKey && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                      style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
                    >
                      <span className="-ml-1 size-2 rounded-full bg-brand" />
                      <span className="h-px flex-1 bg-brand" />
                    </div>
                  )}
                  {blocks.map(({ task, start, duration }) => {
                    const position = layout.get(task.id);
                    return (
                      <CalendarBlock
                        key={task.id}
                        task={task}
                        days={days}
                        position={{ dayIndex, startMinutes: start }}
                        durationMinutes={duration}
                        lane={position?.lane ?? 0}
                        laneCount={position?.laneCount ?? 1}
                        hourHeight={HOUR_HEIGHT}
                        getColumnWidth={() => columnRef.current?.getBoundingClientRect().width ?? 0}
                        onMove={handleMove}
                        onOpen={onOpen}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
