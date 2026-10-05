"use client";

import { ArrowUp, RotateCcw, SquarePen } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Spark } from "@/components/shared/spark";
import { StateMessage } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { applyProposalAction, askAssistantAction, dismissProposalAction } from "../actions";
import { ASK_QUESTION_MAX_LENGTH } from "../schemas/assistant-schemas";
import type { ChatMessage, ProposalStatus } from "../types";
import { AssistantMessage } from "./assistant-message";

const SUGGESTIONS = [
  "I only have two hours tonight. What should I prioritize?",
  "What's the most important thing to do today?",
  "I'm low on energy — what can wait until tomorrow?",
];

type AskViewProps = { initialConversationId: string | null; initialMessages: ChatMessage[] };

export function AskView({ initialConversationId, initialMessages }: AskViewProps) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<{ question: string; error: string } | null>(null);
  const [isThinking, startThinking] = useTransition();
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pendingQuestion]);

  function ask(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 2 || isThinking) return;
    setQuestion("");
    setFailedQuestion(null);
    setPendingQuestion(trimmed);

    startThinking(async () => {
      const result = await askAssistantAction({ question: trimmed, conversationId });
      setPendingQuestion(null);
      if (!result.ok) {
        setFailedQuestion({ question: trimmed, error: result.error });
        return;
      }
      setConversationId(result.data.conversationId);
      setMessages(result.data.messages);
    });
  }

  function setProposalStatus(messageId: string, status: ProposalStatus) {
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, proposalStatus: status } : message)),
    );
  }

  async function settle(messageId: string, decision: "apply" | "keep") {
    setBusyMessageId(messageId);
    const result =
      decision === "apply"
        ? await applyProposalAction({ messageId })
        : await dismissProposalAction({ messageId });
    setBusyMessageId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProposalStatus(messageId, decision === "apply" ? "applied" : "dismissed");
    if (decision === "apply") toast.success("Your plan has been updated");
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setFailedQuestion(null);
  }

  const isEmpty = messages.length === 0 && !pendingQuestion && !failedQuestion;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col px-4 pt-8 md:min-h-dvh md:px-8 md:pt-14">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-[28px]">
            Ask AI
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Questions about your plans, answered from your tasks.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={startNewConversation}>
            <SquarePen />
            New chat
          </Button>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-8 py-8" aria-live="polite">
        {isEmpty && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <StateMessage
              className="py-0"
              title="What would you like to figure out?"
              description="I'll look at your tasks and suggest a plan. Nothing changes until you say so."
            />
            <div className="flex w-full flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="cursor-pointer rounded-lg border border-border px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-border-strong hover:bg-hover hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <UserBubble key={message.id} text={message.content} />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              isBusy={busyMessageId === message.id}
              onApply={() => settle(message.id, "apply")}
              onKeep={() => settle(message.id, "keep")}
            />
          ),
        )}

        {pendingQuestion && (
          <>
            <UserBubble text={pendingQuestion} />
            <div role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex size-7 items-center justify-center rounded-full bg-brand-soft">
                <Spark className="size-3.5 animate-spark" />
              </div>
              Looking at your tasks…
            </div>
          </>
        )}

        {failedQuestion && (
          <>
            <UserBubble text={failedQuestion.question} />
            <StateMessage
              tone="error"
              className="py-4"
              title="Something went wrong."
              description={failedQuestion.error}
              action={
                <Button variant="secondary" size="sm" onClick={() => ask(failedQuestion.question)}>
                  <RotateCcw />
                  Try again
                </Button>
              }
            />
          </>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
        className="sticky bottom-24 mb-6 md:bottom-6"
      >
        <div className="relative rounded-xl border border-border-strong bg-card shadow-input focus-within:border-brand/50 focus-within:shadow-[0_0_0_4px_var(--brand-soft)]">
          <label htmlFor="ask-input" className="sr-only">
            Ask about your plans
          </label>
          <textarea
            id="ask-input"
            rows={1}
            value={question}
            maxLength={ASK_QUESTION_MAX_LENGTH}
            placeholder="Ask about your day…"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                ask(question);
              }
            }}
            className="field-sizing-content max-h-40 min-h-[52px] w-full resize-none bg-transparent py-3.5 pr-14 pl-4 text-[15px] outline-none placeholder:text-subtle-foreground"
          />
          <Button
            type="submit"
            variant="brand"
            size="icon-sm"
            disabled={question.trim().length < 2 || isThinking}
            aria-label="Send"
            className="absolute right-2.5 bottom-2.5 rounded-lg disabled:bg-hover disabled:text-subtle-foreground disabled:opacity-100"
          >
            <ArrowUp />
          </Button>
        </div>
      </form>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-selected px-4 py-2.5 text-[15px] leading-relaxed"
    >
      {text}
    </motion.p>
  );
}
