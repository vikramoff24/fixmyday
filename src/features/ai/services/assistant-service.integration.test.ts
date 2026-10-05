import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTask, getTasksForDay } from "@/features/tasks/services/task-service";
import type { Database } from "@/lib/db/client";
import { aiConversations, tasks } from "@/lib/db/schema";
import { AppError, NotFoundError } from "@/lib/errors";
import type { UserClock } from "@/lib/time-zone";
import { testEnv } from "@/test/mock-env";
import { createTestDatabase } from "@/test/test-db";
import { applyProposal, askAssistant, dismissProposal, getLatestConversation } from "./assistant-service";

let database: Awaited<ReturnType<typeof createTestDatabase>>;

vi.mock("@/config/env", () => ({ getServerEnv: () => testEnv }));
vi.mock("@/lib/db/client", () => ({ getDb: (): Database => database.db }));

const USER = "user_assistant";
const OTHER = "user_other";
const clock: UserClock = {
  timeZone: "UTC",
  now: new Date("2026-10-05T17:00:00Z"),
  todayKey: "2026-10-05",
  nowMinutes: 17 * 60,
};

async function seedEvening() {
  const base = { dueDate: "2026-10-05" } as const;
  await createTask(
    USER,
    {
      ...base,
      title: "Finish PR",
      category: "work",
      priority: "high",
      startTime: "18:00",
      estimatedMinutes: 45,
    },
    "UTC",
  );
  await createTask(
    USER,
    {
      ...base,
      title: "Gym",
      category: "health",
      priority: "medium",
      startTime: "19:00",
      estimatedMinutes: 60,
    },
    "UTC",
  );
  await createTask(
    USER,
    {
      ...base,
      title: "Groceries",
      category: "personal",
      priority: "low",
      startTime: "20:30",
      estimatedMinutes: 45,
    },
    "UTC",
  );
}

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(async () => database.close());
beforeEach(async () => {
  await database.db.delete(aiConversations);
  await database.db.delete(tasks);
});

describe("assistant service (integration, offline assistant)", () => {
  it("answers from the user's tasks and only applies changes after confirmation", async () => {
    await seedEvening();

    const { messages } = await askAssistant(
      USER,
      { question: "I only have two hours tonight. What should I prioritize?", conversationId: null },
      clock,
    );
    const answer = messages.at(-1);

    expect(answer?.proposal?.focus.map((item) => item.taskTitle)).toEqual(["Finish PR", "Gym"]);
    expect(answer?.proposal?.changes).toEqual([
      expect.objectContaining({
        kind: "reschedule",
        taskTitle: "Groceries",
        dueDate: "2026-10-06",
        startTime: "20:30",
      }),
    ]);
    expect(answer?.proposalStatus).toBe("pending");
    // Nothing moved yet.
    expect((await getTasksForDay(USER, "2026-10-05")).map((task) => task.title)).toContain("Groceries");

    const applied = await applyProposal(USER, answer!.id, "UTC");
    expect(applied).toBe(1);
    expect((await getTasksForDay(USER, "2026-10-06")).map((task) => task.title)).toEqual(["Groceries"]);

    // Applying twice is refused.
    await expect(applyProposal(USER, answer!.id, "UTC")).rejects.toBeInstanceOf(AppError);
  });

  it("keeps the conversation and lets the user dismiss suggestions", async () => {
    await seedEvening();
    const first = await askAssistant(USER, { question: "I have 1 hour", conversationId: null }, clock);
    const answer = first.messages.at(-1)!;
    await dismissProposal(USER, answer.id);

    const latest = await getLatestConversation(USER);
    expect(latest.conversationId).toBe(first.conversationId);
    expect(latest.messages.map((message) => message.role)).toEqual(["user", "assistant"]);
    expect(latest.messages[1].proposalStatus).toBe("dismissed");
  });

  it("isolates conversations and suggestions between users", async () => {
    await seedEvening();
    const { conversationId, messages } = await askAssistant(
      USER,
      { question: "I have 30 min", conversationId: null },
      clock,
    );

    await expect(applyProposal(OTHER, messages.at(-1)!.id, "UTC")).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      askAssistant(OTHER, { question: "hello there", conversationId }, clock),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect((await getLatestConversation(OTHER)).messages).toEqual([]);
  });
});
