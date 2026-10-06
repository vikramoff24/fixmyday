import "server-only";
import { z } from "zod";

// Empty strings in .env files should behave like "not set".
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString,
    CLERK_SECRET_KEY: optionalString,
    OPENAI_API_KEY: optionalString,
    OPENAI_MODEL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).default("gpt-5-mini"),
    ),
  })
  .superRefine((env, ctx) => {
    const hasClerkKeys = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY);
    if (env.NODE_ENV === "production" && !hasClerkKeys) {
      ctx.addIssue({
        code: "custom",
        path: ["CLERK_SECRET_KEY"],
        message: "Clerk keys are required in production. Local dev-user mode is development-only.",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

/**
 * Validated server-side environment. Parsed lazily so `next build` can
 * compile without production secrets present; the first request fails fast
 * with a readable message if something is missing.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}\nSee .env.example.`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
