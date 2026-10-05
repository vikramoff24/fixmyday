import "server-only";
import { z } from "zod";

import { AppError, type AppErrorCode } from "@/lib/errors";

export type ActionErrorCode = AppErrorCode | "UNEXPECTED";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code: ActionErrorCode };

const UNEXPECTED_MESSAGE = "Something went wrong on our side. Please try again.";

/**
 * Runs a server action body and converts failures into a serialisable result.
 * Server actions are public endpoints, so we never let raw errors (which may
 * contain SQL or stack traces) reach the client.
 */
export async function runAction<T>(actionName: string, body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await body();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "AI_UNAVAILABLE" || error.code === "AI_INVALID_OUTPUT") {
        console.warn(`[action:${actionName}] ${error.code}`, error.cause ?? "");
      }
      return { ok: false, error: error.userMessage, code: error.code };
    }

    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: "Some of the information wasn't valid. Please check and try again.",
        code: "VALIDATION",
      };
    }

    console.error(`[action:${actionName}] unexpected error`, error);
    return { ok: false, error: UNEXPECTED_MESSAGE, code: "UNEXPECTED" };
  }
}
