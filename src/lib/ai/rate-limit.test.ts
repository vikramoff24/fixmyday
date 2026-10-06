import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit per window, per key", () => {
    const consume = createRateLimiter({ limit: 2, windowMs: 1000 });
    consume("alice", 0);
    consume("alice", 100);
    consume("bob", 100);

    expect(() => consume("alice", 200)).toThrow(AppError);
    expect(() => consume("alice", 200)).toThrow("Try again in 1 second.");
    // A new window starts fresh.
    expect(() => consume("alice", 1000)).not.toThrow();
  });
});
