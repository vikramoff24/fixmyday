import { ArrowUp, ChevronsUp, Equal, ArrowDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { CATEGORY_LABELS, PRIORITY_LABELS, type TaskCategory, type TaskPriority } from "../constants";

export const categoryDotClass: Record<TaskCategory, string> = {
  work: "bg-cat-work",
  personal: "bg-cat-personal",
  health: "bg-cat-health",
  finance: "bg-cat-finance",
  learning: "bg-cat-learning",
  other: "bg-cat-other",
};

export const categoryTextClass: Record<TaskCategory, string> = {
  work: "text-cat-work",
  personal: "text-cat-personal",
  health: "text-cat-health",
  finance: "text-cat-finance",
  learning: "text-cat-learning",
  other: "text-cat-other",
};

/** Soft background tint, e.g. for calendar blocks. */
export const categoryTintClass: Record<TaskCategory, string> = {
  work: "bg-cat-work/14 border-cat-work/30",
  personal: "bg-cat-personal/14 border-cat-personal/30",
  health: "bg-cat-health/14 border-cat-health/30",
  finance: "bg-cat-finance/14 border-cat-finance/30",
  learning: "bg-cat-learning/14 border-cat-learning/30",
  other: "bg-cat-other/14 border-cat-other/30",
};

export function CategoryLabel({ category, className }: { category: TaskCategory; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", categoryDotClass[category])} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

const priorityIcon = {
  urgent: ChevronsUp,
  high: ArrowUp,
  medium: Equal,
  low: ArrowDown,
} satisfies Record<TaskPriority, unknown>;

const priorityTextClass: Record<TaskPriority, string> = {
  urgent: "text-prio-urgent",
  high: "text-prio-high",
  medium: "text-prio-medium",
  low: "text-prio-low",
};

export function PriorityLabel({
  priority,
  className,
  hideMedium = false,
}: {
  priority: TaskPriority;
  className?: string;
  /** Medium is the default; hiding it keeps dense lists calm. */
  hideMedium?: boolean;
}) {
  if (hideMedium && priority === "medium") return null;
  const Icon = priorityIcon[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        priorityTextClass[priority],
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
