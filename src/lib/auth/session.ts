import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getServerEnv } from "@/config/env";
import { isClerkEnabled } from "@/config/features";
import { UnauthenticatedError } from "@/lib/errors";

/**
 * Stable id used when Clerk isn't configured in local development. Env
 * validation refuses to start production without Clerk, so this can never
 * be reached by real users.
 */
export const LOCAL_DEV_USER_ID = "local-dev-user";

/**
 * Returns the signed-in user's id, derived from the server-side session only.
 * Never accept a user id from the client.
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Who is asking is request-time information: never prerender or cache it,
  // even in dev-user mode where no cookie or header is read.
  await connection();

  if (!isClerkEnabled) {
    return getServerEnv().NODE_ENV === "production" ? null : LOCAL_DEV_USER_ID;
  }

  const { userId } = await auth();
  return userId;
}

/** For server actions and services: throws when there is no session. */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new UnauthenticatedError();
  return userId;
}

/** For pages: sends signed-out visitors to the sign-in page. */
export async function requireUserIdOrRedirect(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}
