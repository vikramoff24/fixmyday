"use server";

import { refresh } from "next/cache";

import { runAction, type ActionResult } from "@/lib/action-result";
import { requireUserId } from "@/lib/auth/session";
import { getUserClock } from "@/lib/time-zone";
import type { Task } from "@/features/tasks/types";
import * as plannerService from "./services/planner-service";
import type { PlanDraft } from "./types";

export async function createPlanDraftAction(input: string): Promise<ActionResult<PlanDraft>> {
  return runAction("createPlanDraft", async () => {
    const userId = await requireUserId();
    return plannerService.createPlanDraft(userId, input, await getUserClock());
  });
}

export async function reorganizePlanDraftAction(draft: PlanDraft): Promise<ActionResult<PlanDraft>> {
  return runAction("reorganizePlanDraft", async () => {
    const userId = await requireUserId();
    return plannerService.reorganizePlanDraft(userId, draft, await getUserClock());
  });
}

export async function acceptPlanDraftAction(draft: PlanDraft): Promise<ActionResult<Task[]>> {
  return runAction("acceptPlanDraft", async () => {
    const userId = await requireUserId();
    const { timeZone } = await getUserClock();
    const tasks = await plannerService.acceptPlanDraft(userId, draft, timeZone);
    refresh();
    return tasks;
  });
}
