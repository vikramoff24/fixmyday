"use client";

import { categoryTintClass, categoryDotClass } from "@/features/tasks/components/task-meta";
import type { Task } from "@/features/tasks/types";
import { isTaskCompleted } from "@/features/tasks/utils/task-utils";
import { cn } from "@/lib/utils/cn";
import { formatWeekdayLong } from "@/lib/utils/format";
import { formatMinutes, type DateKey } from "@/lib/utils/zoned-time";
import { useBlockDrag, type BlockPosition } from "../hooks/use-block-drag";
import { MIN_BLOCK_MINUTES } from "../utils/calendar-layout";

type CalendarBlockProps = {
  task: Task;
  days: DateKey[];
  position: BlockPosition;
  durationMinutes: number;
  lane: number;
  laneCount: number;
  hourHeight: number;
  getColumnWidth: () => number;
  onMove: (task: Task, position: BlockPosition) => void;
  onOpen: (task: Task) => void;
};

export function CalendarBlock({
  task,
  days,
  position,
  durationMinutes,
  lane,
  laneCount,
  hourHeight,
  getColumnWidth,
  onMove,
  onOpen,
}: CalendarBlockProps) {
  const { preview, isDragging, handlers } = useBlockDrag({
    position,
    durationMinutes,
    dayCount: days.length,
    hourHeight,
    getColumnWidth,
    onMove: (next) => onMove(task, next),
    onActivate: () => onOpen(task),
  });

  const shown = preview ?? position;
  const dayOffset = shown.dayIndex - position.dayIndex;
  const visibleMinutes = Math.max(durationMinutes, MIN_BLOCK_MINUTES);
  const top = (shown.startMinutes / 60) * hourHeight;
  const height = (visibleMinutes / 60) * hourHeight - 2;
  const isShort = visibleMinutes <= 40;
  const completed = isTaskCompleted(task);
  const timeRange = `${formatMinutes(shown.startMinutes)}–${formatMinutes(shown.startMinutes + durationMinutes)}`;

  return (
    <button
      type="button"
      {...handlers}
      aria-label={`${task.title}, ${formatWeekdayLong(days[shown.dayIndex])} ${timeRange}. Arrow keys move it.`}
      className={cn(
        "absolute flex cursor-grab touch-manipulation flex-col overflow-hidden rounded-md border px-2 text-left select-none",
        "transition-[box-shadow,opacity] duration-150 hover:shadow-input focus-visible:z-20",
        categoryTintClass[task.category],
        isShort ? "justify-center py-0.5" : "py-1.5",
        completed && "opacity-55",
        isDragging && "z-30 cursor-grabbing shadow-elevated ring-1 ring-ring/60",
      )}
      style={{
        top,
        height,
        // Lanes split the column for overlapping tasks; a day offset shifts the
        // block into a neighbouring column while dragging.
        left: `calc(${(lane / laneCount) * 100}% + ${dayOffset * 100}% + 2px)`,
        width: `calc(${100 / laneCount}% - 4px)`,
      }}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", categoryDotClass[task.category])} />
        <span className={cn("truncate text-xs font-medium", completed && "line-through")}>{task.title}</span>
      </span>
      {!isShort && (
        <span className="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">{timeRange}</span>
      )}
    </button>
  );
}
