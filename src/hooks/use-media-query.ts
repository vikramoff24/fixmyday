"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. Returns `false` during server rendering,
 * so prefer CSS breakpoints for layout and use this only for behaviour
 * (e.g. choosing a bottom sheet vs. a side panel).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const MOBILE_QUERY = "(max-width: 767px)";
