import { describe, expect, it } from "vitest";

import { buildTask } from "@/test/factories";
import { applyTaskChanges } from "./task-patch";
import {
  calculateDailyProgress,
  getCompletedAtForStatus,
  getTaskEnd,
  sortTasksForTimeline,
} from "./task-utils";

describe("calculateDailyProgress", () => {
  it("counts completed tasks and ignores cancelled ones", () => {
    const tasks = [
      buildTask({ status: "completed" }),
      buildTask({ status: "completed" }),
      buildTask({ status: "todo" }),
      buildTask({ status: "cancelled" }),
    ];
    expect(calculateDailyProgress(tasks)).toEqual({ completed: 2, total: 3, percent: 67 });
  });

  it("is zero for an empty day", () => {
    expect(calculateDailyProgress([])).toEqual({ completed: 0, total: 0, percent: 0 });
  });
});

describe("sortTasksForTimeline", () => {
  it("orders by start time, then unscheduled tasks by priority", () => {
    const late = buildTask({ title: "late", scheduledStart: new Date("2026-10-05T18:00:00Z") });
    const early = buildTask({ title: "early", scheduledStart: new Date("2026-10-05T09:00:00Z") });
    const low = buildTask({ title: "low", priority: "low" });
    const urgent = buildTask({ title: "urgent", priority: "urgent" });

    expect(sortTasksForTimeline([low, late, urgent, early]).map((task) => task.title)).toEqual([
      "early",
      "late",
      "urgent",
      "low",
    ]);
  });
});

describe("getCompletedAtForStatus", () => {
  const now = new Date("2026-10-05T12:00:00Z");

  it("stamps completion time once and clears it when reopened", () => {
    expect(getCompletedAtForStatus("completed", null, now)).toBe(now);
    const earlier = new Date("2026-10-04T12:00:00Z");
    expect(getCompletedAtForStatus("completed", earlier, now)).toBe(earlier);
    expect(getCompletedAtForStatus("todo", earlier, now)).toBeNull();
  });
});

describe("getTaskEnd", () => {
  it("uses the estimate, or a default length", () => {
    const start = new Date("2026-10-05T09:00:00Z");
    expect(getTaskEnd(buildTask({ scheduledStart: start, estimatedMinutes: 45 }))?.toISOString()).toBe(
      "2026-10-05T09:45:00.000Z",
    );
    expect(getTaskEnd(buildTask({ scheduledStart: start }))?.toISOString()).toBe("2026-10-05T09:30:00.000Z");
    expect(getTaskEnd(buildTask())).toBeNull();
  });
});

describe("applyTaskChanges (optimistic preview)", () => {
  it("predicts the saved task", () => {
    const task = buildTask({ dueDate: "2026-10-05", scheduledStart: new Date("2026-10-05T09:00:00Z") });
    const next = applyTaskChanges(
      task,
      { status: "completed", dueDate: "2026-10-06", startTime: "14:30" },
      "UTC",
    );

    expect(next.status).toBe("completed");
    expect(next.completedAt).toBeInstanceOf(Date);
    expect(next.scheduledStart?.toISOString()).toBe("2026-10-06T14:30:00.000Z");
  });

  it("clears the time when the date is removed", () => {
    const task = buildTask({ dueDate: "2026-10-05", scheduledStart: new Date("2026-10-05T09:00:00Z") });
    expect(applyTaskChanges(task, { dueDate: null }, "UTC").scheduledStart).toBeNull();
  });
});
