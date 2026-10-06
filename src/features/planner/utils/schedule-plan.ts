import { PRIORITY_RANK } from "@/features/tasks/constants";
import type { PlanningWindow } from "@/features/settings/schemas/settings-schemas";
import { addDays, formatMinutes, roundUpToStep, type DateKey } from "@/lib/utils/zoned-time";
import { formatRelativeDay } from "@/lib/utils/format";
import type { BusyBlock, PlanTaskDraft, TimeOfDay, UnderstoodTask } from "../types";

/** Slots start on quarter hours so plans read naturally. */
export const SLOT_STEP_MINUTES = 15;
/** Breathing room between consecutive tasks. */
export const BUFFER_MINUTES = 15;
/** How far ahead a task may be pushed when its own day is full. */
const MAX_DAYS_TO_PUSH = 6;
/** Warn when more than this share of the planning window is booked. */
const FULL_DAY_RATIO = 0.75;

const TIME_OF_DAY_BOUNDS: Record<Exclude<TimeOfDay, "anytime">, { start: number; end: number }> = {
  morning: { start: 0, end: 12 * 60 },
  afternoon: { start: 12 * 60, end: 18 * 60 },
  evening: { start: 18 * 60, end: 24 * 60 },
};

export type ScheduleContext = {
  window: PlanningWindow;
  todayKey: DateKey;
  nowMinutes: number;
  /** Time already taken by the user's existing tasks. */
  busy: BusyBlock[];
};

export type ScheduleResult = {
  tasks: PlanTaskDraft[];
  warnings: string[];
};

type Interval = { start: number; end: number; title: string };

/**
 * Turns understood tasks into a realistic plan:
 *
 * 1. Tasks with an explicit time are placed exactly where the user asked
 *    (conflicts are reported, not silently moved).
 * 2. Remaining tasks are placed most-important-first into the earliest free
 *    slot of their preferred part of the day, after their dependencies.
 * 3. A task that doesn't fit falls back to the rest of its day, then to the
 *    following days, and finally stays unscheduled — always with a warning.
 */
export function schedulePlan(tasks: UnderstoodTask[], context: ScheduleContext): ScheduleResult {
  const warnings: string[] = [];
  const occupied = new Map<DateKey, Interval[]>();
  const placed = new Map<string, { date: DateKey; end: number }>();
  const results = new Map<string, PlanTaskDraft>();

  for (const block of context.busy) {
    addInterval(occupied, block.date, {
      start: block.startMinutes,
      end: block.endMinutes,
      title: block.title,
    });
  }

  // 1. Pinned tasks keep the time the user gave — unless it has already passed,
  //    in which case they're scheduled like flexible tasks below.
  const pinnedKeys = new Set<string>();
  for (const task of tasks) {
    if (task.fixedStartMinutes === null) continue;

    const start = task.fixedStartMinutes;
    if (isInPast(task.date, start, context)) {
      warnings.push(
        `${task.title} was set for ${formatMinutes(start)}, which has already passed, so I found the next free time.`,
      );
      continue;
    }
    pinnedKeys.add(task.key);

    const end = start + task.estimatedMinutes;
    const clash = findOverlap(occupied.get(task.date) ?? [], start, end);
    if (clash) {
      warnings.push(`${task.title} at ${formatMinutes(start)} overlaps with ${clash.title}.`);
    }

    addInterval(occupied, task.date, { start, end, title: task.title });
    placed.set(task.key, { date: task.date, end });
    results.set(task.key, toDraft(task, task.date, start, true));
  }

  // 2. Flexible tasks, most important first, once their dependencies are placed.
  const pending = tasks.filter((task) => !pinnedKeys.has(task.key));
  const knownKeys = new Set(tasks.map((task) => task.key));

  while (pending.length > 0) {
    const nextIndex = pickNextTaskIndex(pending, placed, knownKeys);
    const [task] = pending.splice(nextIndex, 1);

    const earliest = getEarliestStartAfterDependencies(task, placed);
    const slot = findSlotForTask(task, earliest, occupied, context);

    if (!slot) {
      warnings.push(`Couldn't find room for ${task.title} this week — it's saved without a time.`);
      results.set(task.key, toDraft(task, task.date, null, false));
      // Dependants can still be planned; treat this task as "done" at the start of its day.
      placed.set(task.key, { date: task.date, end: 0 });
      continue;
    }

    if (slot.date !== task.date) {
      warnings.push(
        `${task.title} didn't fit on ${formatRelativeDay(task.date, context.todayKey).toLowerCase()}, so I moved it to ${formatRelativeDay(slot.date, context.todayKey).toLowerCase()}.`,
      );
    }

    const end = slot.start + task.estimatedMinutes;
    addInterval(occupied, slot.date, { start: slot.start, end, title: task.title });
    placed.set(task.key, { date: slot.date, end });
    results.set(task.key, toDraft(task, slot.date, slot.start, false));
  }

  const plannedDates = new Set([...results.values()].map((task) => task.date));
  warnings.push(...findOverbookedDays(occupied, plannedDates, context));

  // Present the plan in the order it will actually happen.
  const ordered = tasks.map((task) => results.get(task.key)).filter((task) => task !== undefined);
  ordered.sort(comparePlanDrafts);

  return { tasks: ordered, warnings };
}

export function comparePlanDrafts(a: PlanTaskDraft, b: PlanTaskDraft): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.startMinutes === null) return 1;
  if (b.startMinutes === null) return -1;
  return a.startMinutes - b.startMinutes;
}

function toDraft(
  task: UnderstoodTask,
  date: DateKey,
  startMinutes: number | null,
  isPinned: boolean,
): PlanTaskDraft {
  return {
    key: task.key,
    title: task.title,
    category: task.category,
    priority: task.priority,
    estimatedMinutes: task.estimatedMinutes,
    date,
    startMinutes,
    isPinned,
    timeOfDay: task.timeOfDay,
    dependsOn: task.dependsOn,
    notes: task.notes,
  };
}

function addInterval(occupied: Map<DateKey, Interval[]>, date: DateKey, interval: Interval) {
  const intervals = occupied.get(date) ?? [];
  intervals.push(interval);
  intervals.sort((a, b) => a.start - b.start);
  occupied.set(date, intervals);
}

function findOverlap(intervals: Interval[], start: number, end: number): Interval | undefined {
  return intervals.find((interval) => start < interval.end && end > interval.start);
}

/**
 * Picks the most important task whose dependencies are all placed. Unknown
 * dependency keys are ignored; if every remaining task waits on another
 * (a cycle), the most important one goes first so we never loop forever.
 */
function pickNextTaskIndex(
  pending: UnderstoodTask[],
  placed: Map<string, unknown>,
  knownKeys: Set<string>,
): number {
  const isReady = (task: UnderstoodTask) =>
    task.dependsOn.every((key) => !knownKeys.has(key) || placed.has(key) || key === task.key);

  let bestIndex = -1;
  for (let index = 0; index < pending.length; index++) {
    if (!isReady(pending[index])) continue;
    if (bestIndex === -1 || compareImportance(pending[index], pending[bestIndex]) < 0) {
      bestIndex = index;
    }
  }

  if (bestIndex !== -1) return bestIndex;

  let fallbackIndex = 0;
  for (let index = 1; index < pending.length; index++) {
    if (compareImportance(pending[index], pending[fallbackIndex]) < 0) fallbackIndex = index;
  }
  return fallbackIndex;
}

/** Earlier dates first, then higher priority; ties keep the user's order. */
function compareImportance(a: UnderstoodTask, b: UnderstoodTask): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
}

function getEarliestStartAfterDependencies(
  task: UnderstoodTask,
  placed: Map<string, { date: DateKey; end: number }>,
): { date: DateKey; minutes: number } {
  let date = task.date;
  let minutes = 0;

  for (const key of task.dependsOn) {
    const dependency = placed.get(key);
    if (!dependency || key === task.key) continue;
    if (dependency.date > date) {
      date = dependency.date;
      minutes = dependency.end + BUFFER_MINUTES;
    } else if (dependency.date === date) {
      minutes = Math.max(minutes, dependency.end + BUFFER_MINUTES);
    }
  }

  return { date, minutes };
}

function findSlotForTask(
  task: UnderstoodTask,
  earliest: { date: DateKey; minutes: number },
  occupied: Map<DateKey, Interval[]>,
  context: ScheduleContext,
): { date: DateKey; start: number } | null {
  for (let dayOffset = 0; dayOffset <= MAX_DAYS_TO_PUSH; dayOffset++) {
    const date = addDays(earliest.date, dayOffset);
    const earliestToday = dayOffset === 0 ? earliest.minutes : 0;
    const dayBounds = getAvailableBounds(date, earliestToday, context);
    if (!dayBounds) continue;

    const intervals = occupied.get(date) ?? [];

    // Prefer the part of the day the task asked for, then anywhere in the day.
    if (task.timeOfDay !== "anytime") {
      const preferred = TIME_OF_DAY_BOUNDS[task.timeOfDay];
      const start = findFreeStart(
        intervals,
        Math.max(dayBounds.start, preferred.start),
        Math.min(dayBounds.end, preferred.end),
        task.estimatedMinutes,
      );
      if (start !== null) return { date, start };
    }

    const start = findFreeStart(intervals, dayBounds.start, dayBounds.end, task.estimatedMinutes);
    if (start !== null) return { date, start };
  }
  return null;
}

function isInPast(date: DateKey, startMinutes: number, context: ScheduleContext): boolean {
  return date < context.todayKey || (date === context.todayKey && startMinutes < context.nowMinutes);
}

/** The plannable part of a day, or null when nothing is left of it. */
function getAvailableBounds(
  date: DateKey,
  earliestMinutes: number,
  context: ScheduleContext,
): { start: number; end: number } | null {
  if (date < context.todayKey) return null;

  let start = Math.max(context.window.dayStartMinute, earliestMinutes);
  if (date === context.todayKey) {
    // Leave a few minutes to actually get started.
    start = Math.max(start, context.nowMinutes + 5);
  }
  start = roundUpToStep(start, SLOT_STEP_MINUTES);

  const end = context.window.dayEndMinute;
  return start < end ? { start, end } : null;
}

/** Earliest step-aligned start in [from, to] with room for `duration` plus buffers. */
function findFreeStart(intervals: Interval[], from: number, to: number, duration: number): number | null {
  let candidate = roundUpToStep(from, SLOT_STEP_MINUTES);

  while (candidate + duration <= to) {
    const clash = intervals.find(
      (interval) =>
        candidate < interval.end + BUFFER_MINUTES && candidate + duration + BUFFER_MINUTES > interval.start,
    );
    if (!clash) return candidate;
    candidate = roundUpToStep(clash.end + BUFFER_MINUTES, SLOT_STEP_MINUTES);
  }
  return null;
}

function findOverbookedDays(
  occupied: Map<DateKey, Interval[]>,
  plannedDates: Set<DateKey>,
  context: ScheduleContext,
): string[] {
  const windowLength = context.window.dayEndMinute - context.window.dayStartMinute;
  const warnings: string[] = [];

  for (const date of plannedDates) {
    const intervals = occupied.get(date) ?? [];
    const booked = intervals.reduce((total, interval) => total + (interval.end - interval.start), 0);
    if (booked > windowLength * FULL_DAY_RATIO) {
      warnings.push(
        `${formatRelativeDay(date, context.todayKey)} is very full. Consider moving something to keep it realistic.`,
      );
    }
  }
  return warnings;
}
