import type { Task } from "@/features/tasks/types";
import { isValidDateKey, parseTime, type DateKey } from "@/lib/utils/zoned-time";
import type { AiAssistantResponse } from "../schemas/assistant-schemas";
import type { AssistantProposal, ProposedChange } from "../types";
import type { ContextTask } from "./assistant-context";

const MAX_REPLY_LENGTH = 1500;
const MAX_ITEMS = 10;

export type NormalizedAssistantResponse = { reply: string; proposal: AssistantProposal };

/**
 * Business validation for the assistant's answer. Anything that doesn't
 * point at a task we showed it, or that isn't a sensible change, is dropped —
 * the user only ever sees (and can only ever apply) valid suggestions.
 */
export function normalizeAssistantResponse(
  response: AiAssistantResponse,
  contextTasks: ContextTask[],
  todayKey: DateKey,
): NormalizedAssistantResponse {
  const tasksByRef = new Map<string, Task>(contextTasks.map(({ ref, task }) => [ref.toUpperCase(), task]));
  const lookup = (ref: string) => tasksByRef.get(ref.trim().toUpperCase());

  const seenFocus = new Set<string>();
  const focus = response.focus.flatMap((item) => {
    const task = lookup(item.taskRef);
    if (!task || seenFocus.has(task.id)) return [];
    seenFocus.add(task.id);
    return [
      {
        taskId: task.id,
        taskTitle: task.title,
        estimatedMinutes: task.estimatedMinutes,
        reason: item.reason.trim().slice(0, 200),
      },
    ];
  });

  const changedTaskIds = new Set<string>();
  const changes = response.changes.flatMap((change): ProposedChange[] => {
    const task = lookup(change.taskRef);
    // One change per task keeps "apply" unambiguous.
    if (!task || changedTaskIds.has(task.id)) return [];
    const reason = change.reason.trim().slice(0, 200);

    if (change.kind === "reschedule") {
      if (!change.dueDate || !isValidDateKey(change.dueDate) || change.dueDate < todayKey) return [];
      const startTime = change.startTime && parseTime(change.startTime) !== null ? change.startTime : null;
      changedTaskIds.add(task.id);
      return [
        {
          kind: "reschedule",
          taskId: task.id,
          taskTitle: task.title,
          dueDate: change.dueDate,
          startTime,
          reason,
        },
      ];
    }

    if (!change.priority || change.priority === task.priority) return [];
    changedTaskIds.add(task.id);
    return [
      { kind: "change_priority", taskId: task.id, taskTitle: task.title, priority: change.priority, reason },
    ];
  });

  const reply = response.reply.trim().slice(0, MAX_REPLY_LENGTH) || "Here's what I'd suggest.";
  return { reply, proposal: { focus: focus.slice(0, MAX_ITEMS), changes: changes.slice(0, MAX_ITEMS) } };
}
