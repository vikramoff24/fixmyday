"use client";

import { Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { useClock } from "@/components/providers/clock-provider";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MOBILE_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import { formatDuration, formatRelativeDay, formatTimeOfDay } from "@/lib/utils/format";
import { toDateKey } from "@/lib/utils/zoned-time";
import {
  DURATION_OPTIONS,
  STATUS_LABELS,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
} from "../constants";
import type { TaskChanges } from "../schemas/task-schemas";
import type { Task } from "../types";
import { isTaskCompleted } from "../utils/task-utils";
import { CategoryLabel, PriorityLabel } from "./task-meta";
import { TaskCheckbox } from "./task-checkbox";

const NO_DURATION = "none";

type TaskDetailPanelProps = {
  task: Task | null;
  onClose: () => void;
  onUpdate: (task: Task, changes: TaskChanges) => void;
  onToggleComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
};

/**
 * Side panel (bottom sheet on phones) for viewing and editing one task.
 * Every field saves on its own, so there's no "Save" button to forget.
 */
export function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onToggleComplete,
  onDelete,
}: TaskDetailPanelProps) {
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <Sheet open={task !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={isMobile ? "bottom" : "right"} className="overflow-y-auto">
        {task && (
          <TaskDetailBody
            key={task.id}
            task={task}
            onUpdate={onUpdate}
            onToggleComplete={onToggleComplete}
            onDelete={(target) => {
              onClose();
              onDelete(target);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PropertyRow({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-3">
      <label htmlFor={htmlFor} className="text-[13px] text-subtle-foreground">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const quietControl = "border-transparent bg-transparent hover:bg-hover hover:border-transparent";

function TaskDetailBody({
  task,
  onUpdate,
  onToggleComplete,
  onDelete,
}: Omit<TaskDetailPanelProps, "task" | "onClose"> & { task: Task }) {
  const { timeZone, todayKey } = useClock();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.description ?? "");

  const completed = isTaskCompleted(task);
  const startTime = task.scheduledStart ? formatTimeOfDay(task.scheduledStart, timeZone) : "";

  function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(task.title);
      return;
    }
    if (trimmed !== task.title) onUpdate(task, { title: trimmed });
  }

  function saveNotes() {
    const trimmed = notes.trim();
    if (trimmed !== (task.description ?? ""))
      onUpdate(task, { description: trimmed === "" ? null : trimmed });
  }

  function saveSchedule(dueDate: string, time: string) {
    onUpdate(task, { dueDate: dueDate || null, startTime: dueDate && time ? time : null });
  }

  const createdLabel = formatRelativeDay(toDateKey(task.createdAt, timeZone), todayKey);

  return (
    <div className="flex flex-col gap-6 px-5 pt-5 pb-8 md:pt-6">
      <div className="flex items-start gap-3 pr-8">
        <div className="pt-2.5">
          <TaskCheckbox
            checked={completed}
            onCheckedChange={() => onToggleComplete(task)}
            label={task.title}
          />
        </div>
        <div className="min-w-0 flex-1">
          <SheetTitle className="sr-only">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Edit task details</SheetDescription>
          <Textarea
            aria-label="Task title"
            value={title}
            maxLength={TASK_TITLE_MAX_LENGTH}
            rows={1}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            className={`min-h-0 resize-none border-transparent px-1 py-1 text-lg font-semibold tracking-tight hover:border-transparent ${completed ? "text-muted-foreground line-through decoration-1" : ""}`}
          />
          <div className="mt-1 flex items-center gap-3 px-1">
            <CategoryLabel category={task.category} />
            <PriorityLabel priority={task.priority} />
            {task.estimatedMinutes && (
              <span className="text-xs text-subtle-foreground">{formatDuration(task.estimatedMinutes)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <PropertyRow label="Status">
          <Select
            value={task.status}
            onValueChange={(status) => onUpdate(task, { status: status as Task["status"] })}
          >
            <SelectTrigger size="sm" className={quietControl} aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Priority">
          <Select
            value={task.priority}
            onValueChange={(priority) => onUpdate(task, { priority: priority as Task["priority"] })}
          >
            <SelectTrigger size="sm" className={quietControl} aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  <PriorityLabel priority={priority} className="text-sm" />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Category">
          <Select
            value={task.category}
            onValueChange={(category) => onUpdate(task, { category: category as Task["category"] })}
          >
            <SelectTrigger size="sm" className={quietControl} aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  <CategoryLabel category={category} className="text-sm text-foreground" />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Date" htmlFor="task-date">
          <DatePicker
            id="task-date"
            size="sm"
            value={task.dueDate ?? ""}
            onChange={(dueDate) => saveSchedule(dueDate, startTime)}
            placeholder="No date"
            clearable
            className={quietControl}
          />
        </PropertyRow>

        <PropertyRow label="Time" htmlFor="task-time">
          {/* Uncontrolled: time inputs emit changes per keystroke, so we save on blur.
              Keyed by the saved value so it resets when the task changes elsewhere. */}
          <Input
            key={startTime}
            id="task-time"
            type="time"
            step={300}
            defaultValue={startTime}
            disabled={!task.dueDate}
            title={task.dueDate ? undefined : "Pick a date first"}
            onBlur={(event) => {
              if (event.target.value !== startTime) saveSchedule(task.dueDate ?? "", event.target.value);
            }}
            className={`h-8 text-[13px] ${quietControl}`}
          />
        </PropertyRow>

        <PropertyRow label="Duration">
          <Select
            value={task.estimatedMinutes ? String(task.estimatedMinutes) : NO_DURATION}
            onValueChange={(value) =>
              onUpdate(task, { estimatedMinutes: value === NO_DURATION ? null : Number(value) })
            }
          >
            <SelectTrigger size="sm" className={quietControl} aria-label="Duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_DURATION}>Not set</SelectItem>
              {withCurrentOption(DURATION_OPTIONS, task.estimatedMinutes).map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  {formatDuration(minutes)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="task-notes" className="text-[13px] text-subtle-foreground">
          Notes
        </label>
        <Textarea
          id="task-notes"
          value={notes}
          placeholder="Add details, links or context…"
          onChange={(event) => setNotes(event.target.value)}
          onBlur={saveNotes}
          className="min-h-24"
        />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-subtle-foreground">Created {createdLabel.toLowerCase()}</span>
        <Button variant="destructive" size="sm" onClick={() => onDelete(task)}>
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  );
}

/** Keeps an unusual existing value (e.g. 50 min from the AI) selectable. */
function withCurrentOption(options: number[], current: number | null): number[] {
  if (!current || options.includes(current)) return options;
  return [...options, current].sort((a, b) => a - b);
}
