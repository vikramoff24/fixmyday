import { describe, expect, it } from "vitest";

import { parseTaskFilters } from "./task-filters";
import { createTaskInputSchema, updateTaskInputSchema } from "./task-schemas";

describe("createTaskInputSchema", () => {
  it("trims, defaults and normalises input", () => {
    const parsed = createTaskInputSchema.parse({
      title: "  Plan sprint ",
      description: "   ",
      category: "work",
      priority: "high",
      tags: ["Focus", "focus", " deep "],
    });
    expect(parsed).toMatchObject({ title: "Plan sprint", description: null, tags: ["focus", "deep"] });
  });

  it("rejects bad values", () => {
    const base = { title: "x", category: "work", priority: "high" };
    expect(createTaskInputSchema.safeParse({ ...base, title: "" }).success).toBe(false);
    expect(createTaskInputSchema.safeParse({ ...base, category: "gaming" }).success).toBe(false);
    expect(createTaskInputSchema.safeParse({ ...base, estimatedMinutes: 1 }).success).toBe(false);
    expect(createTaskInputSchema.safeParse({ ...base, dueDate: "2026-02-31" }).success).toBe(false);
    expect(createTaskInputSchema.safeParse({ ...base, startTime: "10:00" }).success).toBe(false);
  });
});

describe("updateTaskInputSchema", () => {
  it("requires a real id and date together with time", () => {
    expect(updateTaskInputSchema.safeParse({ id: "not-a-uuid", changes: {} }).success).toBe(false);
    const id = "3f1d2c4e-8a6b-4c2d-9e7f-1a2b3c4d5e6f";
    expect(updateTaskInputSchema.safeParse({ id, changes: { startTime: "10:00" } }).success).toBe(false);
    expect(
      updateTaskInputSchema.safeParse({ id, changes: { startTime: "10:00", dueDate: "2026-10-05" } }).success,
    ).toBe(true);
  });
});

describe("parseTaskFilters", () => {
  it("falls back to defaults for invalid URL values", () => {
    expect(
      parseTaskFilters({ view: "weird", sort: ["priority", "newest"], category: "nope", q: "  gym " }),
    ).toEqual({
      view: "active",
      sort: "priority",
      category: undefined,
      priority: undefined,
      q: "gym",
    });
  });
});
