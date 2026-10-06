import { describe, expect, it } from "vitest";

import type { AiPlanResponse } from "../schemas/plan-schemas";
import { normalizeAiPlan } from "./normalize-ai-plan";

type AiTask = AiPlanResponse["tasks"][number];

function aiTask(overrides: Partial<AiTask>): AiTask {
  return {
    title: "Task",
    category: "work",
    priority: "medium",
    estimatedMinutes: 30,
    date: "2026-10-05",
    startTime: null,
    timeOfDay: "anytime",
    dependsOn: [],
    notes: null,
    ...overrides,
  };
}

describe("normalizeAiPlan", () => {
  it("repairs what it can and drops what it can't", () => {
    const result = normalizeAiPlan(
      {
        summary: "",
        assumptions: ["  Assumed 30 minutes  ", ""],
        tasks: [
          aiTask({ title: "  Finish   PR ", estimatedMinutes: 2000, startTime: "25:00" }),
          aiTask({ title: "   " }),
          aiTask({ title: "Old", date: "2020-01-01", estimatedMinutes: 1, dependsOn: [0, 1, 2, 99] }),
          aiTask({ title: "Garbage date", date: "next tuesday-ish" }),
        ],
      },
      "2026-10-05",
    );

    expect(result.tasks.map((task) => task.title)).toEqual(["Finish PR", "Old", "Garbage date"]);
    expect(result.tasks[0]).toMatchObject({ estimatedMinutes: 720, fixedStartMinutes: null });
    // Past date → today; tiny duration → minimum; dependencies only on kept tasks, never itself.
    expect(result.tasks[1]).toMatchObject({ date: "2026-10-05", estimatedMinutes: 5, dependsOn: ["t1"] });
    expect(result.tasks[2].date).toBe("2026-10-05");
    expect(result.assumptions).toEqual([
      "Assumed 30 minutes",
      "Some dates were in the past, so I moved those tasks to today.",
    ]);
    expect(result.summary).toBe("I've organized 3 things for you.");
  });

  it("caps dates far in the future", () => {
    const result = normalizeAiPlan(
      { summary: "ok", assumptions: [], tasks: [aiTask({ date: "2030-01-01" })] },
      "2026-10-05",
    );
    expect(result.tasks[0].date).toBe("2026-12-04");
  });
});
