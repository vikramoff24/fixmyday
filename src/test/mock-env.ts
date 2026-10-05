import type { ServerEnv } from "@/config/env";

/** Server env for tests: no AI key, so features use their offline paths. */
export const testEnv: ServerEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "pglite://memory",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: undefined,
  CLERK_SECRET_KEY: undefined,
  OPENAI_API_KEY: undefined,
  OPENAI_MODEL: "test-model",
};
