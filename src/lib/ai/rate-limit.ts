import "server-only";

import { AppError } from "@/lib/errors";

type Window = { startedAt: number; count: number };

/**
 * Fixed-window, per-process rate limiter for AI requests. It protects the AI
 * budget from accidental loops and rapid resubmits; with multiple server
 * instances each instance enforces its own limit, which is acceptable here.
 * Swap for a shared store (e.g. Redis) if strict global limits are needed.
 */
export function createRateLimiter(options: { limit: number; windowMs: number }) {
  const windows = new Map<string, Window>();

  return function consume(key: string, now = Date.now()): void {
    const current = windows.get(key);
    if (!current || now - current.startedAt >= options.windowMs) {
      windows.set(key, { startedAt: now, count: 1 });
      return;
    }

    if (current.count >= options.limit) {
      const secondsLeft = Math.ceil((options.windowMs - (now - current.startedAt)) / 1000);
      throw new AppError(
        "RATE_LIMITED",
        `You're going a little fast. Try again in ${secondsLeft} second${secondsLeft === 1 ? "" : "s"}.`,
      );
    }
    current.count += 1;
  };
}

/** Shared budget for every AI feature, per user. */
export const consumeAiRequest = createRateLimiter({ limit: 12, windowMs: 60_000 });
