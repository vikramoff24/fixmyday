/**
 * Feature switches derived from which credentials are present. Safe to import
 * from both server and client code: it only reads public variables or returns
 * booleans, never secret values.
 */

/** Clerk is enabled when its publishable key is configured. */
export const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
