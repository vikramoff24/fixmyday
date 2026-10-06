"use client";

import { AlignLeft } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/format";
import type { Task } from "../types";
import { isTaskCompleted } from "../utils/task-utils";
import { CategoryLabel, categoryDotClass, PriorityLabel } from "./task-meta";
import { TaskCheckbox } from "./task-checkbox";

type TaskItemProps = {
  task: Task;
  /** Left column: usually the start time, or a date in cross-day lists. */
  leading: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onToggleComplete: () => void;
};

/** One row in a task list. The row opens details; the circle completes it. */
export function TaskItem({ task, leading, isSelected, onSelect, onOpen, onToggleComplete }: TaskItemProps) {
  const completed = isTaskCompleted(task);
  const cancelled = task.status === "cancelled";

  return (
    <motion.li
      id={`task-${task.id}`}
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.25 }}
      onMouseEnter={onSelect}
      data-selected={isSelected || undefined}
      className="group relative flex items-center gap-3 rounded-lg pr-2 pl-1 transition-colors data-selected:bg-hover md:gap-4 md:pl-2"
    >
      <span className="w-11 shrink-0 text-right font-mono text-[13px] text-subtle-foreground tabular-nums md:w-12">
        {leading}
      </span>

      <TaskCheckbox
        checked={completed}
        onCheckedChange={onToggleComplete}
        label={task.title}
        className="mx-0"
      />

      <button
        type="button"
        onClick={() => {
          onSelect();
          onOpen();
        }}
        onFocus={onSelect}
        className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-4 py-2.5 text-left outline-none focus-visible:ring-0"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={cn(
              "truncate text-sm font-medium transition-colors duration-300",
              (completed || cancelled) && "text-subtle-foreground line-through decoration-1",
            )}
          >
            {task.title}
          </span>
          {task.description && (
            <AlignLeft aria-label="Has notes" className="size-3.5 shrink-0 text-subtle-foreground" />
          )}
        </span>

        <span className="hidden shrink-0 items-center gap-4 sm:flex">
          <CategoryLabel category={task.category} className="w-[72px]" />
          <span className="w-16">
            <PriorityLabel priority={task.priority} hideMedium />
          </span>
          <span className="w-16 text-right text-xs text-subtle-foreground tabular-nums">
            {task.estimatedMinutes ? formatDuration(task.estimatedMinutes) : ""}
          </span>
        </span>
        <span className="flex shrink-0 items-center sm:hidden">
          <span aria-hidden className={cn("size-1.5 rounded-full", categoryDotClass[task.category])} />
        </span>
      </button>

      {/* Visible keyboard focus for the whole row. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg ring-ring/60 group-has-[button:focus-visible]:ring-2"
      />
    </motion.li>
  );
}
