import type { Metadata } from "next";

import { InsightsView } from "@/features/insights/components/insights-view";
import { getInsights } from "@/features/insights/services/insights-service";
import { requireUserIdOrRedirect } from "@/lib/auth/session";
import { getUserClock } from "@/lib/time-zone";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const userId = await requireUserIdOrRedirect();
  const clock = await getUserClock();
  const insights = await getInsights(userId, clock);
  return <InsightsView insights={insights} todayKey={clock.todayKey} />;
}
