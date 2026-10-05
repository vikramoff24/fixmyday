import type { TaskPriority } from "@/features/tasks/constants";

/** A task the assistant recommends focusing on, in order. */
export type FocusItem = {
  taskId: string;
  taskTitle: string;
  estimatedMinutes: number | null;
  reason: string;
};

/** A change the assistant suggests. Nothing is applied until the user confirms. */
export type ProposedChange =
  | {
      kind: "reschedule";
      taskId: string;
      taskTitle: string;
      /** Local date, YYYY-MM-DD. */
      dueDate: string;
      /** Local time "HH:MM", or null to keep the task unscheduled that day. */
      startTime: string | null;
      reason: string;
    }
  | {
      kind: "change_priority";
      taskId: string;
      taskTitle: string;
      priority: TaskPriority;
      reason: string;
    };

export type AssistantProposal = {
  focus: FocusItem[];
  changes: ProposedChange[];
};

export type ProposalStatus = "pending" | "applied" | "dismissed";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposal: AssistantProposal | null;
  proposalStatus: ProposalStatus | null;
  createdAt: Date;
};
