"use client";

import { Search, X } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_SEARCH_INPUT_ID } from "@/config/dom-ids";
import { cn } from "@/lib/utils/cn";
import { CATEGORY_LABELS, PRIORITY_LABELS, TASK_CATEGORIES, TASK_PRIORITIES } from "../constants";
import {
  TASK_SORTS,
  TASK_VIEWS,
  type TaskFilters,
  type TaskSort,
  type TaskView,
} from "../schemas/task-filters";
import { CategoryLabel, PriorityLabel } from "./task-meta";

const ALL = "all";
const SEARCH_DEBOUNCE_MS = 250;

const VIEW_LABELS: Record<TaskView, string> = { active: "Active", completed: "Completed", all: "All" };
const SORT_LABELS: Record<TaskSort, string> = {
  schedule: "By date",
  priority: "By priority",
  newest: "Newest",
};

type TaskFiltersBarProps = {
  filters: TaskFilters;
  autoFocusSearch: boolean;
  onChange: (changes: Partial<TaskFilters>) => void;
};

export function TaskFiltersBar({ filters, autoFocusSearch, onChange }: TaskFiltersBarProps) {
  const [query, setQuery] = useState(filters.q);
  const commitSearch = useEffectEvent((value: string) => onChange({ q: value }));

  // Debounce search so typing doesn't trigger a server round-trip per keystroke.
  useEffect(() => {
    if (query.trim() === filters.q) return;
    const timeout = window.setTimeout(() => commitSearch(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [query, filters.q]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground" />
        <Input
          id={TASK_SEARCH_INPUT_ID}
          type="search"
          value={query}
          autoFocus={autoFocusSearch}
          placeholder="Search tasks"
          aria-label="Search tasks"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.blur();
          }}
          className="h-10 pr-16 pl-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-subtle-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : (
          <Kbd className="absolute top-1/2 right-3 -translate-y-1/2">/</Kbd>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Show" className="flex rounded-lg bg-hover p-0.5">
          {TASK_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={filters.view === view}
              onClick={() => onChange({ view })}
              className={cn(
                "h-7 cursor-pointer rounded-md px-3 text-[13px] font-medium transition-colors",
                filters.view === view
                  ? "bg-card text-foreground shadow-sm dark:bg-selected"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {VIEW_LABELS[view]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            value={filters.category ?? ALL}
            onValueChange={(value) =>
              onChange({ category: value === ALL ? undefined : (value as TaskFilters["category"]) })
            }
          >
            <SelectTrigger size="sm" className="w-auto min-w-32" aria-label="Category">
              <SelectValue>
                {filters.category ? CATEGORY_LABELS[filters.category] : "All categories"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={ALL}>All categories</SelectItem>
              {TASK_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  <CategoryLabel category={category} className="text-sm text-foreground" />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority ?? ALL}
            onValueChange={(value) =>
              onChange({ priority: value === ALL ? undefined : (value as TaskFilters["priority"]) })
            }
          >
            <SelectTrigger size="sm" className="w-auto min-w-32" aria-label="Priority">
              <SelectValue>
                {filters.priority ? PRIORITY_LABELS[filters.priority] : "All priorities"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={ALL}>All priorities</SelectItem>
              {TASK_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  <PriorityLabel priority={priority} className="text-sm" />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.sort} onValueChange={(value) => onChange({ sort: value as TaskSort })}>
            <SelectTrigger size="sm" className="w-auto min-w-28" aria-label="Sort">
              <SelectValue>{SORT_LABELS[filters.sort]}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {TASK_SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
