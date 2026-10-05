import { describe, expect, it } from "vitest";

import { splitIntoClauses, toTitle, understandOffline } from "./offline-understanding";

// 2026-10-05 is a Monday.
const context = { todayKey: "2026-10-05", nowMinutes: 8 * 60, dayEndMinute: 22 * 60 };

describe("splitIntoClauses", () => {
  it("splits on commas, 'and' and new lines", () => {
    const clauses = splitIntoClauses("finish my PR, go to gym and buy groceries\ncall mom");
    expect(clauses.map((clause) => clause.text)).toEqual([
      "finish my PR",
      "go to gym",
      "buy groceries",
      "call mom",
    ]);
  });

  it("marks clauses introduced with 'then' as following the previous one", () => {
    const clauses = splitIntoClauses("buy groceries then cook dinner");
    expect(clauses).toEqual([
      { text: "buy groceries", followsPrevious: false },
      { text: "cook dinner", followsPrevious: true },
    ]);
  });
});

describe("toTitle", () => {
  it("removes filler words and tidies casing", () => {
    expect(toTitle("i need to finish my pr")).toBe("Finish PR");
    expect(toTitle("go to the gym")).toBe("Gym");
    expect(toTitle("call my mom")).toBe("Call Mom");
    expect(toTitle("spend  learning ai")).toBe("Learn AI");
    expect(toTitle(": pay rent")).toBe("Pay rent");
  });
});

describe("understandOffline", () => {
  it("understands the canonical brain dump", () => {
    const result = understandOffline(
      "Tomorrow I need to finish my PR, attend the team meeting, go to the gym, buy groceries, call my mom and spend one hour learning AI.",
      context,
    );

    expect(result.tasks.map((task) => task.title)).toEqual([
      "Finish PR",
      "Attend the team meeting",
      "Gym",
      "Buy groceries",
      "Call Mom",
      "Learn AI",
    ]);
    expect(result.tasks.every((task) => task.date === "2026-10-06")).toBe(true);
    expect(result.tasks.map((task) => task.category)).toEqual([
      "work",
      "work",
      "health",
      "personal",
      "personal",
      "learning",
    ]);
    expect(result.tasks.find((task) => task.title === "Learn AI")?.estimatedMinutes).toBe(60);
    expect(result.summary).toBe("I've organized 6 things for you.");
  });

  it("reads explicit times and parts of the day", () => {
    const result = understandOffline("dentist at 3, then pay rent tonight. gym after work", context);
    const [dentist, rent, gym] = result.tasks;

    expect(dentist.fixedStartMinutes).toBe(15 * 60);
    expect(result.assumptions.some((assumption) => assumption.includes("15:00"))).toBe(true);
    expect(rent).toMatchObject({ category: "finance", timeOfDay: "evening", dependsOn: [dentist.key] });
    expect(gym).toMatchObject({ category: "health", timeOfDay: "evening", title: "Gym" });
  });

  it("parses durations, weekdays and urgency", () => {
    const result = understandOffline("urgent: send the invoice friday for 15 min", context);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toMatchObject({
      priority: "urgent",
      estimatedMinutes: 15,
      date: "2026-10-09",
      category: "finance",
    });
  });

  it("plans for tomorrow when it is already late", () => {
    const result = understandOffline("read a book", { ...context, nowMinutes: 21 * 60 + 30 });
    expect(result.tasks[0].date).toBe("2026-10-06");
    expect(result.assumptions).toContain("It's late, so I planned these for tomorrow.");
  });

  it("returns no tasks for text without anything actionable", () => {
    expect(understandOffline("  ,, and ", context).tasks).toEqual([]);
  });
});
