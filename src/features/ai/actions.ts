"use server";

import { refresh } from "next/cache";

import { runAction, type ActionResult } from "@/lib/action-result";
import { requireUserId } from "@/lib/auth/session";
import { getUserClock } from "@/lib/time-zone";
import { proposalActionInputSchema, type AskInput } from "./schemas/assistant-schemas";
import * as assistantService from "./services/assistant-service";
import type { ChatMessage } from "./types";

export async function askAssistantAction(
  input: AskInput,
): Promise<ActionResult<{ conversationId: string; messages: ChatMessage[] }>> {
  return runAction("askAssistant", async () => {
    const userId = await requireUserId();
    return assistantService.askAssistant(userId, input, await getUserClock());
  });
}

export async function applyProposalAction(input: {
  messageId: string;
}): Promise<ActionResult<{ applied: number }>> {
  return runAction("applyProposal", async () => {
    const userId = await requireUserId();
    const { messageId } = proposalActionInputSchema.parse(input);
    const { timeZone } = await getUserClock();
    const applied = await assistantService.applyProposal(userId, messageId, timeZone);
    refresh();
    return { applied };
  });
}

export async function dismissProposalAction(input: { messageId: string }): Promise<ActionResult<null>> {
  return runAction("dismissProposal", async () => {
    const userId = await requireUserId();
    const { messageId } = proposalActionInputSchema.parse(input);
    await assistantService.dismissProposal(userId, messageId);
    return null;
  });
}
