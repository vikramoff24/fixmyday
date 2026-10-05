import "server-only";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { DEFAULT_PLANNING_WINDOW, type PlanningWindow } from "../schemas/settings-schemas";

/**
 * Creates the user's row on first write. Users are created lazily (rather
 * than via an auth webhook) so a fresh sign-in works without extra setup.
 */
export async function ensureUser(userId: string): Promise<void> {
  await getDb().insert(users).values({ id: userId }).onConflictDoNothing({ target: users.id });
}

export async function getPlanningWindow(userId: string): Promise<PlanningWindow> {
  const [user] = await getDb()
    .select({ dayStartMinute: users.dayStartMinute, dayEndMinute: users.dayEndMinute })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? DEFAULT_PLANNING_WINDOW;
}

export async function updatePlanningWindow(userId: string, window: PlanningWindow): Promise<PlanningWindow> {
  await ensureUser(userId);
  await getDb()
    .update(users)
    .set({ dayStartMinute: window.dayStartMinute, dayEndMinute: window.dayEndMinute })
    .where(eq(users.id, userId));
  return window;
}
