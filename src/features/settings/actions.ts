"use server";

import { refresh } from "next/cache";

import { runAction, type ActionResult } from "@/lib/action-result";
import { requireUserId } from "@/lib/auth/session";
import { parseTime } from "@/lib/utils/zoned-time";
import {
  planningWindowFormSchema,
  type PlanningWindow,
  type PlanningWindowForm,
} from "./schemas/settings-schemas";
import { updatePlanningWindow } from "./services/user-service";

export async function updatePlanningWindowAction(
  input: PlanningWindowForm,
): Promise<ActionResult<PlanningWindow>> {
  return runAction("updatePlanningWindow", async () => {
    const userId = await requireUserId();
    const { dayStart, dayEnd } = planningWindowFormSchema.parse(input);
    const window = await updatePlanningWindow(userId, {
      // Both are valid "HH:MM" strings after parsing.
      dayStartMinute: parseTime(dayStart) ?? 0,
      dayEndMinute: parseTime(dayEnd) ?? 0,
    });
    refresh();
    return window;
  });
}
