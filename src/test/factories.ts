import type { Task } from "@/features/tasks/types";

let sequence = 0;

/** Builds a task with sensible defaults; override only what a test cares about. */
export function buildTask(overrides: Partial<Task> = {}): Task {
  sequence += 1;
  const createdAt = new Date("2026-10-01T12:00:00Z");
  return {
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    userId: "user_test",
    planId: null,
    title: `Task ${sequence}`,
    description: null,
    category: "other",
    priority: "medium",
    status: "todo",
    dueDate: null,
    scheduledStart: null,
    estimatedMinutes: null,
    tags: [],
    completedAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}
