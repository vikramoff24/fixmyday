import { z } from "zod";

import { TASK_PRIORITIES } from "@/features/tasks/constants";
import { uuidSchema } from "@/lib/validation/common";

export const ASK_QUESTION_MAX_LENGTH = 1000;

export const askInputSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "Ask me something about your plans.")
    .max(ASK_QUESTION_MAX_LENGTH, "That's a long question — try making it shorter."),
  conversationId: uuidSchema.nullable(),
});

export type AskInput = z.input<typeof askInputSchema>;

/**
 * The structure requested from the model. Tasks are referenced by short refs
 * ("T1", "T2"…) that we hand out in the prompt, never by database ids, so the
 * model can't address anything we didn't show it. Strict rules are applied
 * afterwards in `normalizeAssistantResponse`.
 */
export const aiAssistantResponseSchema = z.object({
  reply: z.string(),
  focus: z.array(z.object({ taskRef: z.string(), reason: z.string() })),
  changes: z.array(
    z.object({
      taskRef: z.string(),
      kind: z.enum(["reschedule", "change_priority"]),
      dueDate: z.string().nullable().describe("YYYY-MM-DD for reschedule, else null"),
      startTime: z.string().nullable().describe("HH:MM for reschedule when a time matters, else null"),
      priority: z.enum(TASK_PRIORITIES).nullable().describe("For change_priority, else null"),
      reason: z.string(),
    }),
  ),
});

export type AiAssistantResponse = z.infer<typeof aiAssistantResponseSchema>;

export const proposalActionInputSchema = z.object({ messageId: uuidSchema });
