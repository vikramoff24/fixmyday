"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { DEFAULT_TASK_FILTERS, type TaskFilters } from "../schemas/task-filters";

/**
 * Filters live in the URL so they survive refreshes and can be shared or
 * bookmarked. Default values are left out to keep URLs clean.
 */
export function useTaskFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setFilters(changes: Partial<TaskFilters>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("focus");

    for (const [key, value] of Object.entries(changes)) {
      const isDefault = value === DEFAULT_TASK_FILTERS[key as keyof TaskFilters];
      if (value === undefined || value === "" || isDefault) params.delete(key);
      else params.set(key, String(value));
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function clearFilters() {
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return { setFilters, clearFilters, isPending };
}
