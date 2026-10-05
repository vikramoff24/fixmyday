import { describe, expect, it } from "vitest";

import { buildTask } from "@/test/factories";
import { computeInsights } from "./compute-insights";

// Wednesday 2026-10-07; the week runs Mon 10-05 → Sun 10-11. UTC keeps hours readable.
const context = { todayKey: "2026-10-07", timeZone: "UTC" };

function completedAt(iso: string, overrides = {}) {
  return buildTask({
    status: "completed",
    completedAt: new Date(iso),
    dueDate: iso.slice(0, 10),
    ...overrides,
  });
}

describe("computeInsights", () => {
  it("compares this week so far with the same point last week", () => {
    const insights = computeInsights(
      [
        completedAt("2026-10-05T10:00:00Z"),
        completedAt("2026-10-06T10:00:00Z"),
        completedAt("2026-10-07T10:00:00Z"),
        completedAt("2026-09-30T10:00:00Z"),
        completedAt("2026-09-29T10:00:00Z"),
        // Later in last week than "today" is now — not part of the comparison.
        completedAt("2026-10-02T10:00:00Z"),
      ],
      context,
    );

    expect(insights.completedThisWeek).toBe(3);
    expect(insights.completedLastWeek).toBe(3);
    expect(insights.weekOverWeekChange).toBe(50);
    expect(insights.thisWeek.map((day) => day.completed)).toEqual([1, 1, 1, 0, 0, 0, 0]);
  });

  it("reports no change percentage when last week was empty", () => {
    const insights = computeInsights([completedAt("2026-10-05T10:00:00Z")], context);
    expect(insights.weekOverWeekChange).toBeNull();
  });

  it("calculates completion rate over this week's due tasks, ignoring cancelled ones", () => {
    const insights = computeInsights(
      [
        completedAt("2026-10-05T10:00:00Z"),
        buildTask({ dueDate: "2026-10-08" }),
        buildTask({ dueDate: "2026-10-09" }),
        buildTask({ dueDate: "2026-10-09", status: "cancelled" }),
      ],
      context,
    );
    expect(insights.completionRate).toBe(33);
  });

  it("finds when a category of tasks tends to get done", () => {
    const learning = { category: "learning" as const, estimatedMinutes: 30 };
    const insights = computeInsights(
      [
        completedAt("2026-10-05T19:10:00Z", learning),
        completedAt("2026-10-06T20:30:00Z", learning),
        completedAt("2026-10-07T19:45:00Z", learning),
        completedAt("2026-10-01T09:00:00Z", { category: "work", estimatedMinutes: 90 }),
        completedAt("2026-10-02T14:00:00Z", { category: "work", estimatedMinutes: 60 }),
      ],
      context,
    );

    expect(insights.insight).toBe(
      "You tend to complete learning tasks most consistently between 7 PM–9 PM. Consider scheduling learning work in that window.",
    );
    expect(insights.averageMinutes).toBe(48);
    expect(insights.byCategory[0]).toEqual({ category: "learning", completed: 3 });
  });

  it("asks for more data before claiming patterns", () => {
    const insights = computeInsights([completedAt("2026-10-05T10:00:00Z")], context);
    expect(insights.insight).toMatch(/Complete a few more tasks/);
    expect(insights.mostProductiveDay).toBeNull();
  });
});
