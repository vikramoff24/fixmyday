import { describe, expect, it } from "vitest";

import type { UnderstoodTask } from "../types";
import { schedulePlan, type ScheduleContext } from "./schedule-plan";

const TODAY = "2026-10-05";
const TOMORROW = "2026-10-06";

function makeTask(
  overrides: Partial<UnderstoodTask> & Pick<UnderstoodTask, "key" | "title">,
): UnderstoodTask {
  return {
    category: "other",
    priority: "medium",
    estimatedMinutes: 60,
    date: TOMORROW,
    fixedStartMinutes: null,
    timeOfDay: "anytime",
    dependsOn: [],
    notes: null,
    ...overrides,
  };
}

const baseContext: ScheduleContext = {
  window: { dayStartMinute: 9 * 60, dayEndMinute: 22 * 60 },
  todayKey: TODAY,
  nowMinutes: 8 * 60,
  busy: [],
};

const at = (hours: number, minutes = 0) => hours * 60 + minutes;

describe("schedulePlan", () => {
  it("places morning work first and evening errands later, by priority", () => {
    const result = schedulePlan(
      [
        makeTask({ key: "gym", title: "Gym", category: "health", timeOfDay: "evening" }),
        makeTask({
          key: "pr",
          title: "Finish PR",
          priority: "high",
          timeOfDay: "morning",
          estimatedMinutes: 90,
        }),
        makeTask({ key: "meet", title: "Team meeting", priority: "high", timeOfDay: "morning" }),
        makeTask({ key: "ai", title: "Learn AI", priority: "low", timeOfDay: "evening" }),
      ],
      baseContext,
    );

    expect(result.tasks.map((task) => [task.title, task.startMinutes])).toEqual([
      ["Finish PR", at(9)],
      ["Team meeting", at(10, 45)],
      ["Gym", at(18)],
      ["Learn AI", at(19, 15)],
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps explicit times pinned and reports conflicts instead of moving them", () => {
    const result = schedulePlan(
      [makeTask({ key: "call", title: "Call bank", fixedStartMinutes: at(10), estimatedMinutes: 30 })],
      {
        ...baseContext,
        busy: [{ date: TOMORROW, startMinutes: at(9, 30), endMinutes: at(10, 30), title: "Standup" }],
      },
    );

    expect(result.tasks[0]).toMatchObject({ startMinutes: at(10), isPinned: true });
    expect(result.warnings).toEqual(["Call bank at 10:00 overlaps with Standup."]);
  });

  it("works around existing tasks with a buffer between them", () => {
    const result = schedulePlan([makeTask({ key: "a", title: "Write report", timeOfDay: "morning" })], {
      ...baseContext,
      busy: [{ date: TOMORROW, startMinutes: at(9), endMinutes: at(10), title: "Existing" }],
    });
    expect(result.tasks[0].startMinutes).toBe(at(10, 15));
  });

  it("never schedules today's tasks in the past", () => {
    const result = schedulePlan([makeTask({ key: "a", title: "Laundry", date: TODAY })], {
      ...baseContext,
      nowMinutes: at(14, 7),
    });
    expect(result.tasks[0]).toMatchObject({ date: TODAY, startMinutes: at(14, 15) });
  });

  it("schedules dependants after the task they depend on", () => {
    const result = schedulePlan(
      [
        makeTask({ key: "cook", title: "Cook dinner", priority: "urgent", dependsOn: ["shop"] }),
        makeTask({ key: "shop", title: "Buy groceries", priority: "low" }),
      ],
      baseContext,
    );
    const shop = result.tasks.find((task) => task.key === "shop");
    const cook = result.tasks.find((task) => task.key === "cook");
    expect(shop?.startMinutes).toBe(at(9));
    expect(cook?.startMinutes).toBe(at(10, 15));
  });

  it("survives dependency cycles", () => {
    const result = schedulePlan(
      [
        makeTask({ key: "a", title: "A", dependsOn: ["b"] }),
        makeTask({ key: "b", title: "B", dependsOn: ["a"] }),
      ],
      baseContext,
    );
    expect(result.tasks.every((task) => task.startMinutes !== null)).toBe(true);
  });

  it("moves a task to the next day when its day is full, and says so", () => {
    const result = schedulePlan(
      [makeTask({ key: "a", title: "Deep work", date: TODAY, estimatedMinutes: 120 })],
      {
        ...baseContext,
        nowMinutes: at(20, 30),
      },
    );
    expect(result.tasks[0]).toMatchObject({ date: TOMORROW, startMinutes: at(9) });
    expect(result.warnings[0]).toBe("Deep work didn't fit on today, so I moved it to tomorrow.");
  });

  it("leaves a task unscheduled when it can never fit", () => {
    const result = schedulePlan(
      [makeTask({ key: "a", title: "Marathon", estimatedMinutes: 14 * 60 })],
      baseContext,
    );
    expect(result.tasks[0].startMinutes).toBeNull();
    expect(result.warnings[0]).toContain("Couldn't find room for Marathon");
  });

  it("warns when a day is overbooked", () => {
    const tasks = Array.from({ length: 10 }, (_, index) =>
      makeTask({ key: `t${index}`, title: `Task ${index}`, estimatedMinutes: 60 }),
    );
    const result = schedulePlan(tasks, baseContext);
    expect(result.warnings).toContain(
      "Tomorrow is very full. Consider moving something to keep it realistic.",
    );
  });
});
