"use client";

import { CalendarDays, X } from "lucide-react";
import { useState } from "react";

import { useClock } from "@/components/providers/clock-provider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import { formatMediumDate, formatRelativeDay } from "@/lib/utils/format";
import { addDays, dayOfWeek, type DateKey } from "@/lib/utils/zoned-time";

type DatePickerProps = {
  id?: string;
  /** A date key ("YYYY-MM-DD"), or "" for no date. */
  value: DateKey | "";
  onChange: (value: DateKey | "") => void;
  placeholder?: string;
  /** Offer a "No date" option. */
  clearable?: boolean;
  size?: "sm" | "default";
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
};

function quickPicks(today: DateKey) {
  // Next Monday, or a week from today if today is Monday.
  const nextWeek = addDays(today, (8 - dayOfWeek(today)) % 7 || 7);
  return [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "Next week", date: nextWeek },
  ];
}

const NEARBY_DAYS = new Set(["Today", "Tomorrow", "Yesterday"]);

/** "Today · Mon, Oct 5" for nearby days, otherwise "Thu, Oct 15". */
function dateLabel(value: DateKey, today: DateKey): string {
  const relative = formatRelativeDay(value, today);
  return NEARBY_DAYS.has(relative) ? `${relative} · ${formatMediumDate(value)}` : formatMediumDate(value);
}

/**
 * Date field that matches the app's inputs, with a calendar popover and
 * quick picks for the common cases. Values are date keys in the user's zone.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  clearable = false,
  size = "default",
  disabled,
  className,
  ...aria
}: DatePickerProps) {
  const { todayKey } = useClock();
  const [open, setOpen] = useState(false);

  function pick(next: DateKey | "") {
    if (next !== value) onChange(next);
    setOpen(false);
  }

  const label = value ? dateLabel(value, todayKey) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        data-size={size}
        aria-invalid={aria["aria-invalid"]}
        aria-label={aria["aria-label"]}
        className={cn(
          "group flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm whitespace-nowrap transition-colors outline-none",
          "hover:border-border-strong focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none",
          "data-[state=open]:border-ring data-[state=open]:ring-3 data-[state=open]:ring-ring/20",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/70",
          "data-[size=default]:h-9 data-[size=sm]:h-8 data-[size=sm]:text-[13px]",
          className,
        )}
      >
        <CalendarDays
          aria-hidden
          className={cn(
            "size-4 shrink-0 transition-colors",
            value ? "text-muted-foreground" : "text-subtle-foreground",
            "group-data-[state=open]:text-brand-text",
          )}
        />
        <span className={cn("truncate", !value && "text-subtle-foreground")}>{label}</span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-2">
        <div className="flex gap-1 px-1 pt-1 pb-2">
          {quickPicks(todayKey).map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => pick(option.date)}
              className={cn(
                "h-7 flex-1 cursor-pointer rounded-md border px-2 text-xs font-medium transition-colors",
                option.date === value
                  ? "border-brand/40 bg-brand-soft text-foreground"
                  : "border-border text-muted-foreground hover:bg-hover hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="border-t border-border px-1 pt-2">
          <Calendar value={value || null} today={todayKey} onSelect={pick} autoFocus />
        </div>
        {clearable && value && (
          <div className="mt-1 border-t border-border px-1 pt-1">
            <button
              type="button"
              onClick={() => pick("")}
              className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
              No date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
