"use client";

import { motion } from "motion/react";

import { Spark } from "@/components/shared/spark";

/** Shown while the AI reads the user's thoughts. */
export function PlannerThinking() {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-xl border border-border bg-card/60 p-5"
    >
      <div className="flex items-center gap-2.5">
        <Spark className="size-[18px] animate-spark" />
        <span className="text-sm font-medium text-foreground">Understanding your day…</span>
      </div>
      <div className="mt-5 flex flex-col gap-3" aria-hidden>
        {[72, 58, 64].map((width, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="shimmer h-3 w-10 rounded" />
            <div
              className="shimmer h-3 rounded"
              style={{ width: `${width}%`, animationDelay: `${index * 120}ms` }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
