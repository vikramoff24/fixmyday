import { z } from "zod";

import { TASK_CATEGORIES, TASK_PRIORITIES } from "../constants";

export const TASK_VIEWS = ["active", "completed", "all"] as const;
export const TASK_SORTS = ["schedule", "priority", "newest"] as const;

export type TaskView = (typeof TASK_VIEWS)[number];
export type TaskSort = (typeof TASK_SORTS)[number];

/**
 * Filters for the Tasks page, read from URL search params. Invalid values are
 * dropped rather than rejected: a hand-edited URL should still show a page.
 */
export const taskFiltersSchema = z.object({
  view: z.enum(TASK_VIEWS).catch("active"),
  q: z.string().trim().max(100).catch(""),
  category: z.enum(TASK_CATEGORIES).optional().catch(undefined),
  priority: z.enum(TASK_PRIORITIES).optional().catch(undefined),
  sort: z.enum(TASK_SORTS).catch("schedule"),
});

export type TaskFilters = z.infer<typeof taskFiltersSchema>;

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  view: "active",
  q: "",
  category: undefined,
  priority: undefined,
  sort: "schedule",
};

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseTaskFilters(searchParams: RawSearchParams): TaskFilters {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return taskFiltersSchema.parse({
    view: first(searchParams.view),
    q: first(searchParams.q) ?? "",
    category: first(searchParams.category),
    priority: first(searchParams.priority),
    sort: first(searchParams.sort),
  });
}
