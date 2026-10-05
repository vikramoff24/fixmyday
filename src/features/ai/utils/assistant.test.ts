import { describe, expect, it } from "vitest";

import { buildTask } from "@/test/factories";
import { buildContextTasks } from "./assistant-context";
import { normalizeAssistantResponse } from "./normalize-assistant-response";
import { answerOffline, parseAvailableMinutes } from "./offline-assistant";

const TODAY = "2026-10-05";

describe("parseAvailableMinutes", () => {
  it.each([
    ["I only have two hours tonight", 120],
    ["got 45 min", 45],
    ["about half an hour", 30],
    ["1.5 hours left", 90],
    ["what should I do?", null],
  ])("%s → %s", (question, expected) => {
    expect(parseAvailableMinutes(question)).toBe(expected);
  });
});

describe("normalizeAssistantResponse", () => {
  const contextTasks = buildContextTasks([
    buildTask({ title: "Finish PR", priority: "high", estimatedMinutes: 45 }),
    buildTask({ title: "Groceries", priority: "low" }),
  ]);

  it("keeps only valid suggestions about tasks the assistant was shown", () => {
    const result = normalizeAssistantResponse(
      {
        reply: "  Do the PR first.  ",
        focus: [
          { taskRef: "t1", reason: "Deadline" },
          { taskRef: "T1", reason: "duplicate" },
          { taskRef: "T99", reason: "invented" },
        ],
        changes: [
          {
            taskRef: "T2",
            kind: "reschedule",
            dueDate: "2026-10-06",
            startTime: "nonsense",
            priority: null,
            reason: "Later",
          },
          {
            taskRef: "T2",
            kind: "change_priority",
            dueDate: null,
            startTime: null,
            priority: "high",
            reason: "second change",
          },
          {
            taskRef: "T1",
            kind: "reschedule",
            dueDate: "2026-10-01",
            startTime: null,
            priority: null,
            reason: "past",
          },
          {
            taskRef: "T1",
            kind: "change_priority",
            dueDate: null,
            startTime: null,
            priority: "high",
            reason: "same",
          },
        ],
      },
      contextTasks,
      TODAY,
    );

    expect(result.reply).toBe("Do the PR first.");
    expect(result.proposal.focus.map((item) => item.taskTitle)).toEqual(["Finish PR"]);
    expect(result.proposal.changes).toEqual([
      expect.objectContaining({
        kind: "reschedule",
        taskTitle: "Groceries",
        dueDate: "2026-10-06",
        startTime: null,
      }),
    ]);
  });
});

describe("answerOffline", () => {
  it("fits today's most important tasks into the time available", () => {
    const contextTasks = buildContextTasks([
      buildTask({ title: "Learn AI", priority: "low", estimatedMinutes: 30, dueDate: TODAY }),
      buildTask({ title: "Finish PR", priority: "high", estimatedMinutes: 45, dueDate: TODAY }),
      buildTask({ title: "Gym", priority: "medium", estimatedMinutes: 60, dueDate: TODAY }),
      buildTask({ title: "Groceries", priority: "low", estimatedMinutes: 45, dueDate: TODAY }),
      buildTask({ title: "Old chore", priority: "urgent", estimatedMinutes: 10, dueDate: "2026-09-01" }),
    ]);

    const answer = answerOffline("I only have two hours tonight", contextTasks, {
      todayKey: TODAY,
      timeZone: "UTC",
    });
    const titleOf = (ref: string) => contextTasks.find((item) => item.ref === ref)?.task.title;

    expect(answer.focus.map((item) => titleOf(item.taskRef))).toEqual(["Finish PR", "Gym"]);
    expect(answer.changes.map((change) => titleOf(change.taskRef))).toEqual(["Learn AI", "Groceries"]);
    expect(answer.reply).toContain("I'd move Learn AI and Groceries to tomorrow.");
  });

  it("says so when nothing is open", () => {
    const answer = answerOffline("what now?", [], { todayKey: TODAY, timeZone: "UTC" });
    expect(answer.focus).toEqual([]);
    expect(answer.reply).toMatch(/nothing open/);
  });
});
