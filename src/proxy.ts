import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isClerkEnabled } from "@/config/features";

/**
 * Clerk's proxy attaches the session to each request so server code can call
 * `auth()`. Access control itself lives next to the data — every dashboard
 * page, server action and service checks the session — rather than in path
 * matching here, which can drift from the routes it's meant to protect.
 */
const clerkProxy = clerkMiddleware();

// Without Clerk (local development only) requests pass straight through and
// the session helper resolves to the local dev user.
function passthroughProxy() {
  return NextResponse.next();
}

export default isClerkEnabled ? clerkProxy : passthroughProxy;

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
