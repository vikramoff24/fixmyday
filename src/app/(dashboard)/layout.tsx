import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ClockProvider } from "@/components/providers/clock-provider";
import { requireUserIdOrRedirect } from "@/lib/auth/session";
import { getUserClock } from "@/lib/time-zone";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // The proxy already guards these routes; checking here as well means a
  // misconfigured matcher can never expose the app to signed-out visitors.
  await requireUserIdOrRedirect();
  const { timeZone, todayKey } = await getUserClock();

  return (
    <ClockProvider value={{ timeZone, todayKey }}>
      <AppShell>{children}</AppShell>
    </ClockProvider>
  );
}
