import type { TaskRow } from "@/lib/db/schema";

export type { TaskCategory, TaskPriority, TaskStatus } from "../constants";

/** A task as the app sees it. Rows are always scoped to the signed-in user. */
export type Task = TaskRow;

export type DailyProgress = {
  completed: number;
  total: number;
  /** 0–100, rounded. */
  percent: number;
};
