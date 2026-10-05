import type { Metadata } from "next";

import { AskView } from "@/features/ai/components/ask-view";
import { getLatestConversation } from "@/features/ai/services/assistant-service";
import { requireUserIdOrRedirect } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ask AI" };

export default async function AskPage() {
  const userId = await requireUserIdOrRedirect();
  const { conversationId, messages } = await getLatestConversation(userId);
  return <AskView initialConversationId={conversationId} initialMessages={messages} />;
}
