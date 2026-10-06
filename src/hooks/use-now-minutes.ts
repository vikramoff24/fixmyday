"use client";

import { useSyncExternalStore } from "react";

import { minutesSinceMidnight } from "@/lib/utils/zoned-time";

function subscribeToMinuteTicks(onTick: () => void) {
  const interval = window.setInterval(onTick, 15_000);
  return () => window.clearInterval(interval);
}

/**
 * Minutes since local midnight in `timeZone`, kept current while the page is
 * open. During hydration it uses the server's value so markup matches.
 */
export function useNowMinutes(serverMinutes: number, timeZone: string): number {
  return useSyncExternalStore(
    subscribeToMinuteTicks,
    () => minutesSinceMidnight(new Date(), timeZone),
    () => serverMinutes,
  );
}
