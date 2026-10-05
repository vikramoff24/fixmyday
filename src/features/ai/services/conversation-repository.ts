import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { aiConversations, aiMessages, type AiMessageRow } from "@/lib/db/schema";
import type { AssistantProposal, ProposalStatus } from "../types";

/** All queries are scoped to the owning user. */

export async function findLatestConversationId(userId: string): Promise<string | null> {
  const [conversation] = await getDb()
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(1);
  return conversation?.id ?? null;
}

export async function conversationBelongsToUser(userId: string, conversationId: string): Promise<boolean> {
  const [conversation] = await getDb()
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .where(and(eq(aiConversations.userId, userId), eq(aiConversations.id, conversationId)))
    .limit(1);
  return Boolean(conversation);
}

export async function createConversation(userId: string, title: string): Promise<string> {
  const [conversation] = await getDb()
    .insert(aiConversations)
    .values({ userId, title: title.slice(0, 120) })
    .returning({ id: aiConversations.id });
  return conversation.id;
}

export async function touchConversation(userId: string, conversationId: string): Promise<void> {
  await getDb()
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(and(eq(aiConversations.userId, userId), eq(aiConversations.id, conversationId)));
}

export async function findMessages(userId: string, conversationId: string): Promise<AiMessageRow[]> {
  return getDb()
    .select()
    .from(aiMessages)
    .where(and(eq(aiMessages.userId, userId), eq(aiMessages.conversationId, conversationId)))
    .orderBy(asc(aiMessages.createdAt))
    .limit(100);
}

export async function insertMessage(values: {
  userId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  proposal?: AssistantProposal | null;
  proposalStatus?: ProposalStatus | null;
}): Promise<AiMessageRow> {
  const [message] = await getDb().insert(aiMessages).values(values).returning();
  return message;
}

export async function findMessage(userId: string, messageId: string): Promise<AiMessageRow | undefined> {
  const [message] = await getDb()
    .select()
    .from(aiMessages)
    .where(and(eq(aiMessages.userId, userId), eq(aiMessages.id, messageId)))
    .limit(1);
  return message;
}

/** Moves a proposal out of "pending" exactly once; returns false if it already moved. */
export async function settleProposal(
  userId: string,
  messageId: string,
  status: Exclude<ProposalStatus, "pending">,
): Promise<boolean> {
  const updated = await getDb()
    .update(aiMessages)
    .set({ proposalStatus: status })
    .where(
      and(
        eq(aiMessages.userId, userId),
        eq(aiMessages.id, messageId),
        eq(aiMessages.proposalStatus, "pending"),
      ),
    )
    .returning({ id: aiMessages.id });
  return updated.length > 0;
}
