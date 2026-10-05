import { PRIORITY_RANK } from "@/features/tasks/constants";
import { DEFAULT_TASK_MINUTES } from "@/features/tasks/utils/task-utils";
import { formatDuration, formatTimeOfDay } from "@/lib/utils/format";
import { addDays, type DateKey } from "@/lib/utils/zoned-time";
import type { AiAssistantResponse } from "../schemas/assistant-schemas";
import type { ContextTask } from "./assistant-context";

const WORD_NUMBERS: Record<string, number> = {
  an: 1,
  a: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
};

/** "I only have two hours tonight" → 120. Returns null when no time budget is mentioned. */
export function parseAvailableMinutes(question: string): number | null {
  const text = question.toLowerCase();
  if (/\bhalf an hour\b/.test(text)) return 30;
  const match = /\b(an?|one|two|three|four|five|six|\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?)\b/.exec(
    text,
  );
  if (!match) return null;
  const amount = WORD_NUMBERS[match[1]] ?? Number(match[1]);
  return Math.round(match[2].startsWith("h") ? amount * 60 : amount);
}

/**
 * A simple prioritiser used when no AI provider is configured: within the
 * user's time budget, pick open tasks for today by priority, then suggest
 * moving the rest to tomorrow. Produces the same shape as the AI so the
 * same validation and UI apply.
 */
export function answerOffline(
  question: string,
  contextTasks: ContextTask[],
  context: { todayKey: DateKey; timeZone: string },
): AiAssistantResponse {
  const isOpen = ({ task }: ContextTask) => task.status === "todo" || task.status === "in_progress";
  const byImportance = (a: ContextTask, b: ContextTask) => {
    const priority = PRIORITY_RANK[b.task.priority] - PRIORITY_RANK[a.task.priority];
    if (priority !== 0) return priority;
    return (a.task.scheduledStart?.getTime() ?? Infinity) - (b.task.scheduledStart?.getTime() ?? Infinity);
  };

  // Today's work comes first; older unfinished tasks are only considered when
  // today is clear, so a question about tonight doesn't reshuffle last month.
  const today = contextTasks.filter((item) => isOpen(item) && item.task.dueDate === context.todayKey);
  const overdue = contextTasks.filter(
    (item) => isOpen(item) && item.task.dueDate !== null && item.task.dueDate < context.todayKey,
  );
  const candidates = (today.length > 0 ? today : overdue).sort(byImportance);

  if (candidates.length === 0) {
    return {
      reply: "You have nothing open for today. Enjoy the free time — or tell the planner what's next.",
      focus: [],
      changes: [],
    };
  }

  const budget = parseAvailableMinutes(question);
  const chosen: ContextTask[] = [];
  const deferred: ContextTask[] = [];
  let used = 0;

  for (const item of candidates) {
    const minutes = item.task.estimatedMinutes ?? DEFAULT_TASK_MINUTES;
    if (budget === null ? chosen.length < 3 : used + minutes <= budget) {
      chosen.push(item);
      used += minutes;
    } else {
      deferred.push(item);
    }
  }

  const tomorrow = addDays(context.todayKey, 1);
  const intro =
    budget === null
      ? `You have ${candidates.length} open ${candidates.length === 1 ? "thing" : "things"} today. I'd start with the most important ones.`
      : `You have ${candidates.length} open ${candidates.length === 1 ? "thing" : "things"} and about ${formatDuration(budget)}. Here's what fits.`;
  const deferralNote =
    budget !== null && deferred.length > 0 ? ` I'd move ${listTitles(deferred)} to tomorrow.` : "";

  return {
    reply: intro + deferralNote,
    focus: chosen.map(({ ref, task }) => ({
      taskRef: ref,
      reason: task.priority === "urgent" || task.priority === "high" ? "High priority" : "Fits your time",
    })),
    changes:
      budget === null
        ? []
        : deferred.map(({ ref, task }) => ({
            taskRef: ref,
            kind: "reschedule" as const,
            dueDate: tomorrow,
            startTime: task.scheduledStart ? formatTimeOfDay(task.scheduledStart, context.timeZone) : null,
            priority: null,
            reason: "Doesn't fit in the time you have today",
          })),
  };
}

/** "A, B and C", or "A, B and 4 more" for long lists. */
function listTitles(items: ContextTask[], max = 3): string {
  const titles = items.map(({ task }) => task.title);
  if (titles.length === 1) return titles[0];
  if (titles.length <= max) return `${titles.slice(0, -1).join(", ")} and ${titles.at(-1)}`;
  return `${titles.slice(0, max).join(", ")} and ${titles.length - max} more`;
}
