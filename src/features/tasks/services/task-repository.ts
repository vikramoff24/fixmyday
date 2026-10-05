import "server-only";
import {
  and,
  asc,
  between,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { tasks, type NewTaskRow, type TaskRow } from "@/lib/db/schema";
import type { DateKey } from "@/lib/utils/zoned-time";
import type { TaskFilters } from "../schemas/task-filters";

/**
 * Data access for tasks. Every query takes the owner's id and filters by it,
 * so a task id from the client can never reach another user's data.
 */

const OPEN_STATUSES = ["todo", "in_progress"] as const;

export async function findTasksForDates(userId: string, from: DateKey, to: DateKey): Promise<TaskRow[]> {
  return getDb()
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), between(tasks.dueDate, from, to)))
    .orderBy(asc(tasks.scheduledStart), asc(tasks.createdAt));
}

/** Unfinished tasks from days before `beforeDate`. */
export async function findOverdueTasks(userId: string, beforeDate: DateKey): Promise<TaskRow[]> {
  return getDb()
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.userId, userId), lt(tasks.dueDate, beforeDate), inArray(tasks.status, [...OPEN_STATUSES])),
    )
    .orderBy(asc(tasks.dueDate), asc(tasks.scheduledStart))
    .limit(50);
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function findTasksMatching(userId: string, filters: TaskFilters): Promise<TaskRow[]> {
  const conditions: SQL[] = [eq(tasks.userId, userId)];

  if (filters.view === "active") conditions.push(inArray(tasks.status, [...OPEN_STATUSES]));
  if (filters.view === "completed") conditions.push(eq(tasks.status, "completed"));
  if (filters.category) conditions.push(eq(tasks.category, filters.category));
  if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));
  if (filters.q) {
    const pattern = `%${escapeLikePattern(filters.q)}%`;
    const textMatch = or(ilike(tasks.title, pattern), ilike(tasks.description, pattern));
    if (textMatch) conditions.push(textMatch);
  }

  const orderBy = {
    // Scheduled tasks first (soonest first), undated tasks after.
    schedule: [sql`${tasks.dueDate} asc nulls last`, sql`${tasks.scheduledStart} asc nulls last`],
    priority: [
      sql`case ${tasks.priority} when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end`,
      sql`${tasks.dueDate} asc nulls last`,
    ],
    newest: [desc(tasks.createdAt)],
  }[filters.sort];

  if (filters.view === "completed") orderBy.unshift(desc(tasks.completedAt));

  return getDb()
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(500);
}

/** Tasks completed, due or created since a point in time — the raw material for insights. */
export async function findTasksSince(userId: string, since: Date, sinceDate: DateKey): Promise<TaskRow[]> {
  return getDb()
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        or(gte(tasks.completedAt, since), gte(tasks.dueDate, sinceDate), gte(tasks.createdAt, since)),
      ),
    )
    .limit(2000);
}

export async function findTaskById(userId: string, taskId: string): Promise<TaskRow | undefined> {
  const [task] = await getDb()
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
    .limit(1);
  return task;
}

export async function findTasksByIds(userId: string, taskIds: string[]): Promise<TaskRow[]> {
  if (taskIds.length === 0) return [];
  return getDb()
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), inArray(tasks.id, taskIds)));
}

export async function findOpenScheduledTasks(userId: string, from: DateKey, to: DateKey): Promise<TaskRow[]> {
  return getDb()
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        between(tasks.dueDate, from, to),
        isNotNull(tasks.scheduledStart),
        inArray(tasks.status, [...OPEN_STATUSES]),
      ),
    );
}

export async function insertTasks(rows: NewTaskRow[]): Promise<TaskRow[]> {
  if (rows.length === 0) return [];
  return getDb().insert(tasks).values(rows).returning();
}

export async function updateTaskRow(
  userId: string,
  taskId: string,
  values: Partial<Omit<NewTaskRow, "id" | "userId">>,
): Promise<TaskRow | undefined> {
  const [task] = await getDb()
    .update(tasks)
    .set(values)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
    .returning();
  return task;
}

export async function deleteTaskRow(userId: string, taskId: string): Promise<TaskRow | undefined> {
  const [task] = await getDb()
    .delete(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
    .returning();
  return task;
}
