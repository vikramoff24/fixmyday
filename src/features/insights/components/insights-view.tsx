import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Spark } from "@/components/shared/spark";
import { StateMessage } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { categoryDotClass } from "@/features/tasks/components/task-meta";
import { CATEGORY_LABELS } from "@/features/tasks/constants";
import { cn } from "@/lib/utils/cn";
import { formatDuration, formatShortDate } from "@/lib/utils/format";
import type { DateKey } from "@/lib/utils/zoned-time";
import type { Insights } from "../types";
import { WeekChart } from "./week-chart";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}

export function InsightsView({ insights, todayKey }: { insights: Insights; todayKey: DateKey }) {
  const weekLabel = `${formatShortDate(insights.thisWeek[0].date)} – ${formatShortDate(insights.thisWeek[6].date)}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pt-8 pb-16 md:px-8 md:pt-14">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Insights</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">This week · {weekLabel}</p>
      </header>

      {!insights.hasEnoughData ? (
        <StateMessage
          title="No insights yet."
          description="Plan and complete a few tasks — patterns in your week will show up here."
          action={
            <Button asChild variant="brand">
              <Link href="/today">Start planning</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section aria-label="Summary" className="flex flex-col gap-1">
            <p className="flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-tight tabular-nums">
                {insights.completedThisWeek}
              </span>
              <span className="text-[15px] text-muted-foreground">
                {insights.completedThisWeek === 1 ? "task" : "tasks"} completed
              </span>
            </p>
            {insights.weekOverWeekChange !== null ? (
              <p
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  insights.weekOverWeekChange >= 0 ? "text-success" : "text-prio-high",
                )}
              >
                {insights.weekOverWeekChange >= 0 ? (
                  <ArrowUpRight aria-hidden className="size-4" />
                ) : (
                  <ArrowDownRight aria-hidden className="size-4" />
                )}
                {Math.abs(insights.weekOverWeekChange)}% {insights.weekOverWeekChange >= 0 ? "more" : "fewer"}{" "}
                than this time last week
              </p>
            ) : (
              <p className="text-sm text-subtle-foreground">Nothing to compare with last week yet.</p>
            )}
          </section>

          <dl className="grid grid-cols-1 divide-y divide-border rounded-xl border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Stat
              label="Completion rate"
              value={insights.completionRate === null ? "—" : `${insights.completionRate}%`}
            />
            <Stat label="Most productive" value={insights.mostProductiveDay ?? "—"} />
            <Stat
              label="Avg. task length"
              value={insights.averageMinutes === null ? "—" : formatDuration(insights.averageMinutes)}
            />
          </dl>

          <section aria-label="Insight" className="flex gap-3 rounded-xl bg-brand-soft px-5 py-4">
            <Spark className="mt-0.5 size-[18px]" />
            <div>
              <h2 className="text-[13px] font-medium text-brand-text">Insight</h2>
              <p className="mt-1 text-[15px] leading-relaxed">{insights.insight}</p>
            </div>
          </section>

          <WeekChart days={insights.thisWeek} todayKey={todayKey} />

          {insights.byCategory.length > 0 && (
            <section aria-labelledby="by-category-heading" className="flex flex-col gap-3">
              <h2 id="by-category-heading" className="text-[13px] font-medium text-muted-foreground">
                Completed by category · last 4 weeks
              </h2>
              <ul className="flex flex-col gap-2.5">
                {insights.byCategory.map(({ category, completed }) => {
                  const share = (completed / insights.byCategory[0].completed) * 100;
                  return (
                    <li key={category} className="grid grid-cols-[88px_1fr_32px] items-center gap-3 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          aria-hidden
                          className={cn("size-1.5 rounded-full", categoryDotClass[category])}
                        />
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-hover" aria-hidden>
                        <span
                          className={cn("block h-full rounded-full", categoryDotClass[category])}
                          style={{ width: `${share}%` }}
                        />
                      </span>
                      <span className="text-right text-foreground tabular-nums">{completed}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
