"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { DateKey } from "@/lib/utils/zoned-time";

type Clock = {
  /** The user's IANA time zone, as used for server rendering. */
  timeZone: string;
  /** Today's date in that time zone at render time. */
  todayKey: DateKey;
};

const ClockContext = createContext<Clock | null>(null);

export function ClockProvider({ value, children }: { value: Clock; children: ReactNode }) {
  return <ClockContext value={value}>{children}</ClockContext>;
}

export function useClock(): Clock {
  const clock = useContext(ClockContext);
  if (!clock) throw new Error("useClock must be used inside <ClockProvider>.");
  return clock;
}
