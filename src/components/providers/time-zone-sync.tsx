"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { TIME_ZONE_COOKIE } from "@/config/cookies";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")[1];
}

/**
 * Tells the server which time zone the user is in, so "today" means the
 * user's today. Re-renders once if the zone was unknown or has changed
 * (e.g. after travelling).
 */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;

    const current = readCookie(TIME_ZONE_COOKIE);
    if (current && decodeURIComponent(current) === timeZone) return;

    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
