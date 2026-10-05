import "server-only";

import { getDb } from "@/lib/db/client";
import { plans, tasks, type NewTaskRow, type TaskRow } from "@/lib/db/schema";

/** Saves an accepted plan and its tasks atomically — all or nothing. */
export async function insertPlanWithTasks(
  plan: { userId: string; input: string; summary: string },
  taskRows: Omit<NewTaskRow, "planId">[],
): Promise<TaskRow[]> {
  return getDb().transaction(async (tx) => {
    const [savedPlan] = await tx.insert(plans).values(plan).returning({ id: plans.id });
    return tx
      .insert(tasks)
      .values(taskRows.map((row) => ({ ...row, planId: savedPlan.id })))
      .returning();
  });
}
