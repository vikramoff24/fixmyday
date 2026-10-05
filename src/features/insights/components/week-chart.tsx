"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils/cn";
import { formatWeekdayLong, formatWeekdayShort } from "@/lib/utils/format";
import type { DateKey } from "@/lib/utils/zoned-time";
import type { DailyCount } from "../types";

const CHART_HEIGHT = 120;

/** Completed tasks per day this week. One series, so the heading names it — no legend. */
export function WeekChart({ days, todayKey }: { days: DailyCount[]; todayKey: DateKey }) {
  const max = Math.max(1, ...days.map((day) => day.completed));

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-[13px] font-medium text-muted-foreground">Completed per day</figcaption>
      <div className="flex items-end gap-2" style={{ height: CHART_HEIGHT + 24 }} aria-hidden>
        {days.map((day, index) => {
          const height = day.completed === 0 ? 2 : Math.max(6, (day.completed / max) * CHART_HEIGHT);
          const isToday = day.date === todayKey;
          const isFuture = day.date > todayKey;
          return (
            <div key={day.date} className="group flex flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[11px] font-medium text-foreground tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
                {day.completed}
              </span>
              <motion.div
                initial={{ height: 2 }}
                animate={{ height }}
                transition={{ delay: index * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "w-full max-w-9 rounded-t-[4px]",
                  isToday ? "bg-brand" : "bg-muted-foreground/45 group-hover:bg-muted-foreground/70",
                  isFuture && "bg-border-strong",
                )}
              />
              <span
                className={cn("text-[11px] text-subtle-foreground", isToday && "font-medium text-foreground")}
              >
                {formatWeekdayShort(day.date)}
              </span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Tasks completed per day this week</caption>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <th scope="row">{formatWeekdayLong(day.date)}</th>
              <td>{day.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
