import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(ellipse_at_center,var(--brand-soft),transparent_65%)] opacity-60"
      />
      <header className="relative flex h-16 w-full max-w-6xl items-center">
        <Link href="/" aria-label="FixMyDay home">
          <Logo />
        </Link>
      </header>
      <main className="relative flex w-full flex-1 items-start justify-center pt-[8vh] pb-16">
        {children}
      </main>
    </div>
  );
}
