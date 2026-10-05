import type { TaskCategory, TaskPriority } from "@/features/tasks/constants";
import type { DateKey } from "@/lib/utils/zoned-time";

export const TIMES_OF_DAY = ["morning", "afternoon", "evening", "anytime"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

/**
 * A task the planner understood, before it has a slot in the day.
 * `dependsOn` holds the keys of tasks that must happen first.
 */
export type UnderstoodTask = {
  key: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes: number;
  date: DateKey;
  /** Set only when the user named an exact time ("at 3pm"). */
  fixedStartMinutes: number | null;
  timeOfDay: TimeOfDay;
  dependsOn: string[];
  notes: string | null;
};

/** A task in a proposed plan, with the slot the scheduler chose. */
export type PlanTaskDraft = Omit<UnderstoodTask, "fixedStartMinutes"> & {
  /** Minutes after local midnight, or null when it didn't fit anywhere. */
  startMinutes: number | null;
  /** True when the time came from the user and must not be moved. */
  isPinned: boolean;
};

export type PlanDraft = {
  input: string;
  summary: string;
  tasks: PlanTaskDraft[];
  /** Interpretations the planner made on the user's behalf. */
  assumptions: string[];
  /** Problems the user should know about (conflicts, overflow). */
  warnings: string[];
  source: "ai" | "offline";
};

/** Time already taken on a given day, e.g. by existing tasks. */
export type BusyBlock = {
  date: DateKey;
  startMinutes: number;
  endMinutes: number;
  title: string;
};
