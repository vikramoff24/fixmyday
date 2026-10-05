"use client";

import { ArrowRight, Check, Flag } from "lucide-react";
import { motion } from "motion/react";

import { useClock } from "@/components/providers/clock-provider";
import { Spark } from "@/components/shared/spark";
import { Button } from "@/components/ui/button";
import { PRIORITY_LABELS } from "@/features/tasks/constants";
import { formatDuration, formatRelativeDay } from "@/lib/utils/format";
import type { ChatMessage, ProposedChange } from "../types";

type AssistantMessageProps = {
  message: ChatMessage;
  isBusy: boolean;
  onApply: () => void;
  onKeep: () => void;
};

function describeChange(change: ProposedChange, todayKey: string): string {
  if (change.kind === "change_priority") return `Set priority to ${PRIORITY_LABELS[change.priority]}`;
  const day = formatRelativeDay(change.dueDate, todayKey);
  return change.startTime ? `Move to ${day} at ${change.startTime}` : `Move to ${day}`;
}

export function AssistantMessage({ message, isBusy, onApply, onKeep }: AssistantMessageProps) {
  const { todayKey } = useClock();
  const proposal = message.proposal;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft">
        <Spark className="size-3.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <p className="text-[15px] leading-relaxed whitespace-pre-line">{message.content}</p>

        {proposal && proposal.focus.length > 0 && (
          <ol className="flex flex-col gap-1 rounded-xl border border-border bg-card/60 p-2">
            {proposal.focus.map((item, index) => (
              <li key={item.taskId} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-hover text-[11px] font-semibold tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.taskTitle}</span>
                  {item.reason && (
                    <span className="block truncate text-xs text-muted-foreground">{item.reason}</span>
                  )}
                </span>
                {item.estimatedMinutes && (
                  <span className="shrink-0 text-xs text-subtle-foreground tabular-nums">
                    {formatDuration(item.estimatedMinutes)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}

        {proposal && proposal.changes.length > 0 && (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {proposal.changes.map((change) => (
                <li key={change.taskId} className="flex items-start gap-2.5 text-sm">
                  {change.kind === "reschedule" ? (
                    <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle-foreground" />
                  ) : (
                    <Flag aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle-foreground" />
                  )}
                  <span>
                    <span className="font-medium">{change.taskTitle}</span>
                    <span className="text-muted-foreground"> — {describeChange(change, todayKey)}</span>
                  </span>
                </li>
              ))}
            </ul>

            {message.proposalStatus === "pending" && (
              <div className="flex flex-wrap gap-2">
                <Button variant="brand" size="sm" onClick={onApply} disabled={isBusy}>
                  <Check />
                  Apply changes
                </Button>
                <Button variant="secondary" size="sm" onClick={onKeep} disabled={isBusy}>
                  Keep current plan
                </Button>
              </div>
            )}
            {message.proposalStatus === "applied" && (
              <p className="flex items-center gap-1.5 text-xs text-success">
                <Check className="size-3.5" aria-hidden /> Changes applied
              </p>
            )}
            {message.proposalStatus === "dismissed" && (
              <p className="text-xs text-subtle-foreground">Kept your current plan</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
