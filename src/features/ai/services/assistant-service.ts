import "server-only";

import { consumeAiRequest } from "@/lib/ai/rate-limit";
import { generateStructuredOutput, isAiConfigured } from "@/lib/ai/structured-output";
import { AppError, NotFoundError } from "@/lib/errors";
import type { UserClock } from "@/lib/time-zone";
import { addDays } from "@/lib/utils/zoned-time";
import { ensureUser } from "@/features/settings/services/user-service";
import { findOverdueTasks, findTasksForDates } from "@/features/tasks/services/task-repository";
import { updateTask } from "@/features/tasks/services/task-service";
import { isTaskOpen, sortTasksForTimeline } from "@/features/tasks/utils/task-utils";
import type { AiMessageRow } from "@/lib/db/schema";
import { aiAssistantResponseSchema, askInputSchema, type AskInput } from "../schemas/assistant-schemas";
import type { AiAssistantResponse } from "../schemas/assistant-schemas";
import type { ChatMessage } from "../types";
import { buildContextTasks } from "../utils/assistant-context";
import { normalizeAssistantResponse } from "../utils/normalize-assistant-response";
import { answerOffline } from "../utils/offline-assistant";
import { ASSISTANT_INSTRUCTIONS, buildAssistantInput } from "./assistant-prompt";
import * as conversations from "./conversation-repository";

/** Days of upcoming tasks the assistant can see and reason about. */
const CONTEXT_DAYS = 3;
const MAX_CONTEXT_TASKS = 40;
const HISTORY_MESSAGES = 6;

function toChatMessage(row: AiMessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    proposal: row.proposal ?? null,
    proposalStatus: row.proposalStatus ?? null,
    createdAt: row.createdAt,
  };
}

export async function getLatestConversation(
  userId: string,
): Promise<{ conversationId: string | null; messages: ChatMessage[] }> {
  const conversationId = await conversations.findLatestConversationId(userId);
  if (!conversationId) return { conversationId: null, messages: [] };
  const rows = await conversations.findMessages(userId, conversationId);
  return { conversationId, messages: rows.map(toChatMessage) };
}

export async function askAssistant(
  userId: string,
  input: AskInput,
  clock: UserClock,
): Promise<{ conversationId: string; messages: ChatMessage[] }> {
  const { question, conversationId: requestedConversationId } = askInputSchema.parse(input);
  consumeAiRequest(userId);
  await ensureUser(userId);

  let conversationId = requestedConversationId;
  if (conversationId && !(await conversations.conversationBelongsToUser(userId, conversationId))) {
    throw new NotFoundError("conversation");
  }
  conversationId ??= await conversations.createConversation(userId, question);

  const [upcoming, overdue, history] = await Promise.all([
    findTasksForDates(userId, clock.todayKey, addDays(clock.todayKey, CONTEXT_DAYS)),
    findOverdueTasks(userId, clock.todayKey),
    conversations.findMessages(userId, conversationId),
  ]);
  const contextTasks = buildContextTasks(
    sortTasksForTimeline([...overdue, ...upcoming].filter(isTaskOpen)).slice(0, MAX_CONTEXT_TASKS),
  );

  let response: AiAssistantResponse;
  if (isAiConfigured()) {
    response = await generateStructuredOutput({
      name: "assistant_answer",
      schema: aiAssistantResponseSchema,
      instructions: ASSISTANT_INSTRUCTIONS,
      input: buildAssistantInput({
        question,
        todayKey: clock.todayKey,
        nowMinutes: clock.nowMinutes,
        timeZone: clock.timeZone,
        contextTasks,
        history: history
          .slice(-HISTORY_MESSAGES)
          .map((message) => ({ role: message.role, content: message.content })),
      }),
    });
  } else {
    response = answerOffline(question, contextTasks, { todayKey: clock.todayKey, timeZone: clock.timeZone });
  }

  const { reply, proposal } = normalizeAssistantResponse(response, contextTasks, clock.todayKey);

  // Both messages are saved only after a successful answer, so a failed AI
  // call never leaves an unanswered question in the history.
  const userMessage = await conversations.insertMessage({
    userId,
    conversationId,
    role: "user",
    content: question,
  });
  const hasSuggestions = proposal.focus.length > 0 || proposal.changes.length > 0;
  const assistantMessage = await conversations.insertMessage({
    userId,
    conversationId,
    role: "assistant",
    content: reply,
    proposal: hasSuggestions ? proposal : null,
    proposalStatus: proposal.changes.length > 0 ? "pending" : null,
  });
  await conversations.touchConversation(userId, conversationId);

  const earlier = history.map(toChatMessage);
  return {
    conversationId,
    messages: [...earlier, toChatMessage(userMessage), toChatMessage(assistantMessage)],
  };
}

/**
 * Applies a suggestion the user confirmed. The changes are read from the
 * stored message (never from the client), and each one goes through the
 * normal task service, so ownership and validation rules still apply.
 */
export async function applyProposal(userId: string, messageId: string, timeZone: string): Promise<number> {
  const message = await conversations.findMessage(userId, messageId);
  if (!message?.proposal) throw new NotFoundError("suggestion");
  if (message.proposalStatus !== "pending") {
    throw new AppError("CONFLICT", "These changes were already handled.");
  }

  // Claim the proposal first so a double click can't apply it twice.
  const claimed = await conversations.settleProposal(userId, messageId, "applied");
  if (!claimed) throw new AppError("CONFLICT", "These changes were already handled.");

  let applied = 0;
  for (const change of message.proposal.changes) {
    try {
      if (change.kind === "reschedule") {
        await updateTask(
          userId,
          { id: change.taskId, changes: { dueDate: change.dueDate, startTime: change.startTime } },
          timeZone,
        );
      } else {
        await updateTask(userId, { id: change.taskId, changes: { priority: change.priority } }, timeZone);
      }
      applied += 1;
    } catch (error) {
      // A task deleted since the suggestion shouldn't block the others.
      if (!(error instanceof NotFoundError)) throw error;
    }
  }
  return applied;
}

export async function dismissProposal(userId: string, messageId: string): Promise<void> {
  const message = await conversations.findMessage(userId, messageId);
  if (!message) throw new NotFoundError("suggestion");
  await conversations.settleProposal(userId, messageId, "dismissed");
}
