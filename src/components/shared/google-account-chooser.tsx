"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useRef, type ReactNode } from "react";

const GOOGLE_BUTTON_SELECTOR = ".cl-socialButtonsBlockButton__google";

/**
 * Makes Clerk's "Continue with Google" button always show Google's account
 * chooser. Clerk's sign-in flow drops `oidcPrompt` for OAuth providers (it only
 * forwards it for enterprise SSO), so without this Google silently reuses the
 * last account. We start the same sign-in Clerk would, add
 * `prompt=select_account` to Google's URL, and redirect. Clerk's
 * /sign-in/sso-callback route finishes the flow, including first-time Google
 * users, who are transferred to sign-up there.
 */
export function GoogleAccountChooser({ children }: { children: ReactNode }) {
  const clerk = useClerk();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    async function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element) || !event.target.closest(GOOGLE_BUTTON_SELECTOR)) return;
      if (!clerk.loaded || !clerk.client) return;

      // Take over from Clerk's own handler, which runs further down the tree.
      event.preventDefault();
      event.stopPropagation();

      try {
        const signIn = await clerk.client.signIn.create({
          strategy: "oauth_google",
          redirectUrl: new URL("/sign-in/sso-callback", window.location.origin).toString(),
          actionCompleteRedirectUrl: "/today",
        });
        const googleUrl = signIn.firstFactorVerification.externalVerificationRedirectURL;
        if (!googleUrl) throw new Error("Clerk did not return a Google sign-in URL.");
        googleUrl.searchParams.set("prompt", "select_account");
        window.location.assign(googleUrl.toString());
      } catch (error) {
        // Fall back to Clerk's default behaviour rather than leaving the button dead.
        console.error("Google account chooser failed; using Clerk's default flow.", error);
        container?.removeEventListener("click", handleClick, true);
        (event.target as Element).closest<HTMLElement>(GOOGLE_BUTTON_SELECTOR)?.click();
      }
    }

    container.addEventListener("click", handleClick, true);
    return () => container.removeEventListener("click", handleClick, true);
  }, [clerk]);

  return <div ref={containerRef}>{children}</div>;
}
