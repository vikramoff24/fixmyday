import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";
import { testEnv } from "@/test/mock-env";
import { createTestDatabase } from "@/test/test-db";
import { calculateDailyProgress } from "../utils/task-utils";
import * as taskService from "./task-service";

let database: Awaited<ReturnType<typeof createTestDatabase>>;

vi.mock("@/config/env", () => ({ getServerEnv: () => testEnv }));
vi.mock("@/lib/db/client", () => ({ getDb: (): Database => database.db }));

const ALICE = "user_alice";
const BOB = "user_bob";
const TIME_ZONE = "Europe/Berlin";

beforeAll(async () => {
  database = await createTestDatabase();
});

afterAll(async () => {
  await database.close();
});

beforeEach(async () => {
  await database.db.delete(tasks);
});

describe("task service (integration)", () => {
  it("creates, lists, completes a task and updates progress", async () => {
    const created = await taskService.createTask(
      ALICE,
      {
        title: "  Finish PR  ",
        category: "work",
        priority: "high",
        dueDate: "2026-10-05",
        startTime: "09:30",
        estimatedMinutes: 45,
      },
      TIME_ZONE,
    );

    expect(created.title).toBe("Finish PR");
    // 09:30 in Berlin (CEST, UTC+2) is 07:30 UTC.
    expect(created.scheduledStart?.toISOString()).toBe("2026-10-05T07:30:00.000Z");

    await taskService.createTask(
      ALICE,
      { title: "Gym", category: "health", priority: "medium", dueDate: "2026-10-05" },
      TIME_ZONE,
    );

    let today = await taskService.getTasksForDay(ALICE, "2026-10-05");
    expect(calculateDailyProgress(today)).toEqual({ completed: 0, total: 2, percent: 0 });

    const completed = await taskService.updateTask(
      ALICE,
      { id: created.id, changes: { status: "completed" } },
      TIME_ZONE,
    );
    expect(completed.completedAt).toBeInstanceOf(Date);

    today = await taskService.getTasksForDay(ALICE, "2026-10-05");
    expect(calculateDailyProgress(today)).toEqual({ completed: 1, total: 2, percent: 50 });

    const reopened = await taskService.updateTask(
      ALICE,
      { id: created.id, changes: { status: "todo" } },
      TIME_ZONE,
    );
    expect(reopened.completedAt).toBeNull();
  });

  it("keeps the time of day when only the date changes", async () => {
    const task = await taskService.createTask(
      ALICE,
      {
        title: "Call bank",
        category: "finance",
        priority: "medium",
        dueDate: "2026-10-05",
        startTime: "14:00",
      },
      TIME_ZONE,
    );
    const moved = await taskService.updateTask(
      ALICE,
      { id: task.id, changes: { dueDate: "2026-10-07" } },
      TIME_ZONE,
    );
    expect(moved.dueDate).toBe("2026-10-07");
    expect(moved.scheduledStart?.toISOString()).toBe("2026-10-07T12:00:00.000Z");
  });

  it("never lets one user read or change another user's task", async () => {
    const task = await taskService.createTask(
      ALICE,
      { title: "Private", category: "personal", priority: "low" },
      TIME_ZONE,
    );

    await expect(
      taskService.updateTask(BOB, { id: task.id, changes: { title: "Hacked" } }, TIME_ZONE),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(taskService.deleteTask(BOB, task.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(
      await taskService.searchTasks(BOB, {
        view: "all",
        q: "",
        sort: "newest",
        category: undefined,
        priority: undefined,
      }),
    ).toEqual([]);

    const [stillThere] = await taskService.searchTasks(ALICE, {
      view: "all",
      q: "",
      sort: "newest",
      category: undefined,
      priority: undefined,
    });
    expect(stillThere.title).toBe("Private");
  });

  it("deletes a task and restores it with the same id (undo)", async () => {
    const task = await taskService.createTask(
      ALICE,
      { title: "Groceries", category: "personal", priority: "medium", dueDate: "2026-10-05" },
      TIME_ZONE,
    );
    const deleted = await taskService.deleteTask(ALICE, task.id);
    expect(await taskService.getTasksForDay(ALICE, "2026-10-05")).toEqual([]);

    const restored = await taskService.restoreTask(ALICE, { ...deleted });
    expect(restored.id).toBe(task.id);
    expect(await taskService.getTasksForDay(ALICE, "2026-10-05")).toHaveLength(1);
  });

  it("searches, filters and sorts", async () => {
    await taskService.createTask(
      ALICE,
      { title: "Buy groceries", category: "personal", priority: "low" },
      TIME_ZONE,
    );
    await taskService.createTask(
      ALICE,
      { title: "Grocery budget review", category: "finance", priority: "urgent" },
      TIME_ZONE,
    );
    await taskService.createTask(ALICE, { title: "Gym", category: "health", priority: "high" }, TIME_ZONE);

    const results = await taskService.searchTasks(ALICE, {
      view: "active",
      q: "grocer",
      sort: "priority",
      category: undefined,
      priority: undefined,
    });
    expect(results.map((task) => task.title)).toEqual(["Grocery budget review", "Buy groceries"]);

    const finance = await taskService.searchTasks(ALICE, {
      view: "active",
      q: "",
      sort: "schedule",
      category: "finance",
      priority: undefined,
    });
    expect(finance.map((task) => task.title)).toEqual(["Grocery budget review"]);

    // LIKE wildcards in the query are treated as plain text.
    expect(
      await taskService.searchTasks(ALICE, {
        view: "all",
        q: "%",
        sort: "newest",
        category: undefined,
        priority: undefined,
      }),
    ).toEqual([]);
  });

  it("rejects invalid input before it reaches the database", async () => {
    await expect(
      taskService.createTask(ALICE, { title: "   ", category: "work", priority: "high" }, TIME_ZONE),
    ).rejects.toThrow();
    await expect(
      taskService.createTask(
        ALICE,
        { title: "No date", category: "work", priority: "high", startTime: "10:00" },
        TIME_ZONE,
      ),
    ).rejects.toThrow();
  });
});
