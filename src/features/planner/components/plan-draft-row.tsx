"use client";

import { Pin, X } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryLabel, PriorityLabel } from "@/features/tasks/components/task-meta";
import {
  DURATION_OPTIONS,
  PRIORITY_LABELS,
  TASK_PRIORITIES,
  TASK_TITLE_MAX_LENGTH,
  type TaskPriority,
} from "@/features/tasks/constants";
import { formatDuration } from "@/lib/utils/format";
import { formatMinutes, parseTime } from "@/lib/utils/zoned-time";
import type { PlanTaskDraft } from "../types";

type PlanDraftRowProps = {
  task: PlanTaskDraft;
  index: number;
  isEditing: boolean;
  onChange: (task: PlanTaskDraft) => void;
  onRemove: () => void;
};

export function PlanDraftRow({ task, index, isEditing, onChange, onRemove }: PlanDraftRowProps) {
  const time = task.startMinutes === null ? null : formatMinutes(task.startMinutes);

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="group flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-hover"
    >
      {isEditing ? (
        <EditableRow task={task} onChange={onChange} onRemove={onRemove} />
      ) : (
        <>
          <span className="w-12 shrink-0 font-mono text-[13px] text-muted-foreground tabular-nums">
            {time ?? "—"}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</span>
          <span className="hidden items-center gap-4 sm:flex">
            {task.isPinned && <Pin aria-label="Time you chose" className="size-3.5 text-subtle-foreground" />}
            <CategoryLabel category={task.category} className="w-20" />
            <PriorityLabel priority={task.priority} className="w-16" />
            <span className="w-16 text-right text-xs text-subtle-foreground tabular-nums">
              {formatDuration(task.estimatedMinutes)}
            </span>
          </span>
        </>
      )}
    </motion.li>
  );
}

function EditableRow({ task, onChange, onRemove }: Omit<PlanDraftRowProps, "index" | "isEditing">) {
  const time = task.startMinutes === null ? "" : formatMinutes(task.startMinutes);

  function handleTimeChange(value: string) {
    const minutes = value ? parseTime(value) : null;
    // A time the user typed is a commitment: reorganizing must not move it.
    onChange({ ...task, startMinutes: minutes, isPinned: minutes !== null });
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap">
      <Input
        type="time"
        step={300}
        aria-label={`Start time for ${task.title}`}
        value={time}
        onChange={(event) => handleTimeChange(event.target.value)}
        className="h-8 w-[104px] text-[13px] tabular-nums"
      />
      <Input
        aria-label="Task title"
        value={task.title}
        maxLength={TASK_TITLE_MAX_LENGTH}
        onChange={(event) => onChange({ ...task, title: event.target.value })}
        className="h-8 min-w-0 flex-1 basis-40 text-[13px]"
      />
      <Select
        value={task.priority}
        onValueChange={(priority) => onChange({ ...task, priority: priority as TaskPriority })}
      >
        <SelectTrigger size="sm" className="w-[104px]" aria-label="Priority">
          <SelectValue>{PRIORITY_LABELS[task.priority]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TASK_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              <PriorityLabel priority={priority} className="text-sm" />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(task.estimatedMinutes)}
        onValueChange={(value) => onChange({ ...task, estimatedMinutes: Number(value) })}
      >
        <SelectTrigger size="sm" className="w-[112px]" aria-label="Duration">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from(new Set([...DURATION_OPTIONS, task.estimatedMinutes]))
            .sort((a, b) => a - b)
            .map((minutes) => (
              <SelectItem key={minutes} value={String(minutes)}>
                {formatDuration(minutes)}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove ${task.title} from plan`}>
        <X />
      </Button>
    </div>
  );
}
