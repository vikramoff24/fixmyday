"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { runAction, type ActionResult } from "@/lib/action-result";
import { requireUserId } from "@/lib/auth/session";
import { getRequestTimeZone } from "@/lib/time-zone";
import { uuidSchema } from "@/lib/validation/common";
import type { CreateTaskInput, RestoreTaskInput, UpdateTaskInput } from "./schemas/task-schemas";
import * as taskService from "./services/task-service";
import type { Task } from "./types";

/**
 * The client's entry points for task mutations. Each action authenticates,
 * delegates validation and rules to the task service, then refreshes the
 * current route so server-rendered data stays the source of truth.
 */

export async function createTaskAction(input: CreateTaskInput): Promise<ActionResult<Task>> {
  return runAction("createTask", async () => {
    const userId = await requireUserId();
    const task = await taskService.createTask(userId, input, await getRequestTimeZone());
    refresh();
    return task;
  });
}

export async function updateTaskAction(input: UpdateTaskInput): Promise<ActionResult<Task>> {
  return runAction("updateTask", async () => {
    const userId = await requireUserId();
    const task = await taskService.updateTask(userId, input, await getRequestTimeZone());
    refresh();
    return task;
  });
}

const rescheduleInputSchema = z.object({ id: uuidSchema, scheduledStart: z.coerce.date() });

export async function rescheduleTaskAction(input: {
  id: string;
  scheduledStart: Date;
}): Promise<ActionResult<Task>> {
  return runAction("rescheduleTask", async () => {
    const userId = await requireUserId();
    const { id, scheduledStart } = rescheduleInputSchema.parse(input);
    const task = await taskService.rescheduleTask(userId, id, scheduledStart, await getRequestTimeZone());
    refresh();
    return task;
  });
}

export async function deleteTaskAction(input: { id: string }): Promise<ActionResult<Task>> {
  return runAction("deleteTask", async () => {
    const userId = await requireUserId();
    const task = await taskService.deleteTask(userId, uuidSchema.parse(input.id));
    refresh();
    return task;
  });
}

export async function restoreTaskAction(input: RestoreTaskInput): Promise<ActionResult<Task>> {
  return runAction("restoreTask", async () => {
    const userId = await requireUserId();
    const task = await taskService.restoreTask(userId, input);
    refresh();
    return task;
  });
}
