import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Shown on auth pages in local development when Clerk isn't configured. */
export function DevAuthNotice() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border-strong bg-card p-6 shadow-elevated">
      <h1 className="text-lg font-semibold tracking-tight">Local development mode</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Clerk keys aren&apos;t configured, so you&apos;re signed in as a local dev user. Add{" "}
        <code className="rounded bg-hover px-1 py-0.5 text-[12px]">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
        and <code className="rounded bg-hover px-1 py-0.5 text-[12px]">CLERK_SECRET_KEY</code> to enable real
        accounts.
      </p>
      <Button asChild variant="brand" className="mt-5 w-full">
        <Link href="/today">Continue to FixMyDay</Link>
      </Button>
    </div>
  );
}
