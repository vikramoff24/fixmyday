"use client";

import { motion } from "motion/react";

import type { DailyProgress as DailyProgressValue } from "../types";

export function DailyProgress({ progress }: { progress: DailyProgressValue }) {
  const { completed, total, percent } = progress;
  const isDone = total > 0 && completed === total;

  return (
    <section aria-labelledby="daily-progress-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="daily-progress-heading" className="text-[13px] font-medium text-muted-foreground">
          Today&apos;s progress
        </h2>
        <p className="text-[13px] text-muted-foreground tabular-nums" aria-live="polite">
          {isDone ? (
            <span className="text-success">All done — nice work.</span>
          ) : (
            <>
              <span className="font-medium text-foreground">{completed}</span> of {total} completed
            </>
          )}
        </p>
      </div>
      <div
        role="progressbar"
        aria-labelledby="daily-progress-heading"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="relative h-1.5 overflow-hidden rounded-full bg-selected"
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>
    </section>
  );
}
