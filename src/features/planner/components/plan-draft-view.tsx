"use client";

import { AlertTriangle, Check, Pencil, Shuffle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useClock } from "@/components/providers/clock-provider";
import { Spark } from "@/components/shared/spark";
import { Button } from "@/components/ui/button";
import { formatLongDate, formatRelativeDay } from "@/lib/utils/format";
import type { PlanDraft, PlanTaskDraft } from "../types";
import { PlanDraftRow } from "./plan-draft-row";

type PlanDraftViewProps = {
  draft: PlanDraft;
  isEditing: boolean;
  isBusy: boolean;
  busyLabel: string | null;
  onToggleEdit: () => void;
  onChangeTask: (task: PlanTaskDraft) => void;
  onRemoveTask: (key: string) => void;
  onAccept: () => void;
  onReorganize: () => void;
  onDiscard: () => void;
};

function groupByDate(tasks: PlanTaskDraft[]): [string, PlanTaskDraft[]][] {
  const groups = new Map<string, PlanTaskDraft[]>();
  for (const task of tasks) {
    groups.set(task.date, [...(groups.get(task.date) ?? []), task]);
  }
  return [...groups.entries()];
}

export function PlanDraftView({
  draft,
  isEditing,
  isBusy,
  busyLabel,
  onToggleEdit,
  onChangeTask,
  onRemoveTask,
  onAccept,
  onReorganize,
  onDiscard,
}: PlanDraftViewProps) {
  const { todayKey } = useClock();
  let rowIndex = 0;

  return (
    <motion.section
      aria-label="Proposed plan"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-xl border border-border-strong bg-card shadow-input"
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <Spark className="size-[18px]" />
          <h2 className="text-[15px] font-medium tracking-tight" aria-live="polite">
            {draft.summary}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDiscard}
          disabled={isBusy}
          aria-label="Discard plan"
        >
          <X />
        </Button>
      </header>

      <div className="flex flex-col gap-4 px-2 pt-3 pb-1">
        {groupByDate(draft.tasks).map(([date, tasks]) => (
          <div key={date}>
            <h3 className="px-3 pb-1 text-xs font-medium text-subtle-foreground">
              {formatRelativeDay(date, todayKey)}
              <span className="font-normal"> · {formatLongDate(date)}</span>
            </h3>
            <ul className="flex flex-col">
              <AnimatePresence initial={true}>
                {tasks.map((task) => (
                  <PlanDraftRow
                    key={task.key}
                    task={task}
                    index={rowIndex++}
                    isEditing={isEditing}
                    onChange={onChangeTask}
                    onRemove={() => onRemoveTask(task.key)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ))}
      </div>

      {(draft.assumptions.length > 0 || draft.warnings.length > 0) && (
        <div className="mx-5 mt-2 flex flex-col gap-1.5 border-t border-border pt-3">
          {draft.warnings.map((warning) => (
            <p key={warning} className="flex items-start gap-2 text-xs text-prio-high">
              <AlertTriangle aria-hidden className="mt-px size-3.5 shrink-0" />
              {warning}
            </p>
          ))}
          {draft.assumptions.map((assumption) => (
            <p key={assumption} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span aria-hidden className="mt-px w-3.5 shrink-0 text-center text-brand-text">
                ✦
              </span>
              {assumption}
            </p>
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-2 px-5 pt-4 pb-5">
        <Button variant="brand" onClick={onAccept} disabled={isBusy || draft.tasks.length === 0}>
          <Check />
          Accept plan
        </Button>
        <Button variant="secondary" onClick={onToggleEdit} disabled={isBusy} aria-pressed={isEditing}>
          <Pencil />
          {isEditing ? "Done editing" : "Edit"}
        </Button>
        <Button variant="ghost" onClick={onReorganize} disabled={isBusy || draft.tasks.length === 0}>
          <Shuffle />
          Reorganize
        </Button>
        {busyLabel && (
          <span role="status" className="ml-auto text-xs text-muted-foreground">
            {busyLabel}
          </span>
        )}
        {draft.source === "offline" && !busyLabel && (
          <span
            className="ml-auto text-xs text-subtle-foreground"
            title="Add OPENAI_API_KEY to use the AI planner"
          >
            Built-in planner
          </span>
        )}
      </footer>
    </motion.section>
  );
}
