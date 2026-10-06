import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTask, getTasksForDay } from "@/features/tasks/services/task-service";
import type { Database } from "@/lib/db/client";
import { plans, tasks } from "@/lib/db/schema";
import type { UserClock } from "@/lib/time-zone";
import { testEnv } from "@/test/mock-env";
import { createTestDatabase } from "@/test/test-db";
import { acceptPlanDraft, createPlanDraft, reorganizePlanDraft } from "./planner-service";

let database: Awaited<ReturnType<typeof createTestDatabase>>;

vi.mock("@/config/env", () => ({ getServerEnv: () => testEnv }));
vi.mock("@/lib/db/client", () => ({ getDb: (): Database => database.db }));

const USER = "user_planner";
// Monday 2026-10-05, 08:00 in UTC.
const clock: UserClock = {
  timeZone: "UTC",
  now: new Date("2026-10-05T08:00:00Z"),
  todayKey: "2026-10-05",
  nowMinutes: 8 * 60,
};

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(async () => database.close());
beforeEach(async () => {
  await database.db.delete(tasks);
  await database.db.delete(plans);
});

describe("planner service (integration, offline planner)", () => {
  it("turns thoughts into a draft without saving anything", async () => {
    const draft = await createPlanDraft(USER, "finish my PR, gym after work and call mom", clock);

    expect(draft.source).toBe("offline");
    expect(draft.tasks.map((task) => task.title)).toEqual(["Finish PR", "Gym", "Call Mom"]);
    expect(await getTasksForDay(USER, "2026-10-05")).toEqual([]);
  });

  it("schedules around tasks the user already has", async () => {
    await createTask(
      USER,
      {
        title: "Standup",
        category: "work",
        priority: "high",
        dueDate: "2026-10-05",
        startTime: "09:00",
        estimatedMinutes: 60,
      },
      clock.timeZone,
    );

    const draft = await createPlanDraft(USER, "write the report", clock);
    // 09:00–10:00 is taken; 15 minutes of buffer puts the report at 10:15.
    expect(draft.tasks[0].startMinutes).toBe(10 * 60 + 15);
  });

  it("saves an accepted plan as tasks linked to the plan", async () => {
    const draft = await createPlanDraft(USER, "tomorrow: pay rent at 10am and read for 30 min", clock);
    const saved = await acceptPlanDraft(USER, draft, clock.timeZone);

    expect(saved).toHaveLength(2);
    expect(new Set(saved.map((task) => task.planId)).size).toBe(1);
    const rent = saved.find((task) => task.title === "Pay rent");
    expect(rent?.scheduledStart?.toISOString()).toBe("2026-10-06T10:00:00.000Z");
    expect(await getTasksForDay(USER, "2026-10-06")).toHaveLength(2);
  });

  it("re-validates drafts coming back from the client", async () => {
    const draft = await createPlanDraft(USER, "gym", clock);
    const tampered = { ...draft, tasks: [{ ...draft.tasks[0], estimatedMinutes: 100_000 }] };
    await expect(acceptPlanDraft(USER, tampered, clock.timeZone)).rejects.toThrow();
    await expect(acceptPlanDraft(USER, { ...draft, tasks: [] }, clock.timeZone)).rejects.toThrow();
  });

  it("keeps pinned times when reorganizing and repacks the rest", async () => {
    const draft = await createPlanDraft(USER, "read a book, write report", clock);
    const pinned = { ...draft.tasks[0], startMinutes: 20 * 60, isPinned: true };
    const reorganized = await reorganizePlanDraft(USER, { ...draft, tasks: [pinned, draft.tasks[1]] }, clock);

    expect(reorganized.tasks.find((task) => task.key === pinned.key)?.startMinutes).toBe(20 * 60);
  });
});
