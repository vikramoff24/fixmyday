"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, formatMonthYear } from "@/lib/utils/format";
import { addMonths, getMonthGrid, isSameMonth, startOfMonth } from "@/lib/utils/month-grid";
import { addDays, startOfWeek, type DateKey } from "@/lib/utils/zoned-time";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

type CalendarProps = {
  /** The selected day, if any. */
  value?: DateKey | null;
  onSelect: (date: DateKey) => void;
  /** Today in the user's time zone; gets a subtle marker. */
  today: DateKey;
  /** Days that share the selected highlight, e.g. the rest of a visible week. */
  highlighted?: DateKey[];
  /** Focus the selected (or today's) day on mount, e.g. when opened in a popover. */
  autoFocus?: boolean;
  className?: string;
};

/**
 * A compact month calendar. Weeks start on Monday, like the rest of the app,
 * and the grid always shows six weeks so it never jumps in height.
 * Keyboard: arrows move by day/week, PageUp/PageDown by month, Home/End to
 * the start/end of the week, Enter or Space to pick.
 */
export function Calendar({ value, onSelect, today, highlighted, autoFocus, className }: CalendarProps) {
  const initial = value || today;
  const [focused, setFocused] = useState<DateKey>(initial);
  const [month, setMonth] = useState<DateKey>(startOfMonth(initial));
  const [direction, setDirection] = useState<1 | -1>(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(Boolean(autoFocus));

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    // Scoped to the current month: during the slide the outgoing grid is still mounted.
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-month="${month}"] [data-day="${focused}"]`)
      ?.focus();
  }, [focused, month]);

  function showMonth(next: DateKey) {
    const nextMonth = startOfMonth(next);
    if (nextMonth === month) return;
    setDirection(nextMonth > month ? 1 : -1);
    setMonth(nextMonth);
  }

  function moveFocus(next: DateKey) {
    shouldFocus.current = true;
    setFocused(next);
    showMonth(next);
  }

  function pageMonth(delta: 1 | -1) {
    const next = addMonths(isSameMonth(focused, month) ? focused : month, delta);
    setFocused(next);
    showMonth(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, () => DateKey> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
      Home: () => startOfWeek(focused),
      End: () => addDays(startOfWeek(focused), 6),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveFocus(move());
  }

  const days = getMonthGrid(month);
  const highlightedSet = new Set(highlighted);

  return (
    <div className={cn("flex w-[17rem] flex-col gap-2 select-none", className)}>
      <div className="flex items-center justify-between pl-2">
        <span aria-live="polite" className="text-sm font-semibold tracking-tight">
          {formatMonthYear(month)}
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => pageMonth(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => pageMonth(1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7" aria-hidden>
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="flex h-7 items-center justify-center text-[11px] font-medium text-subtle-foreground"
          >
            {weekday}
          </span>
        ))}
      </div>

      <div ref={gridRef} className="relative overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.div
            key={month}
            data-month={month}
            role="grid"
            aria-label={formatMonthYear(month)}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            onKeyDown={handleKeyDown}
            className="grid grid-cols-7 gap-y-0.5"
          >
            {Array.from({ length: 6 }, (_, week) => (
              <div key={week} role="row" className="contents">
                {days.slice(week * 7, week * 7 + 7).map((day) => {
                  const isSelected = day === value;
                  const isToday = day === today;
                  const inMonth = isSameMonth(day, month);
                  const isHighlighted = !isSelected && highlightedSet.has(day);
                  return (
                    <div
                      key={day}
                      role="gridcell"
                      aria-selected={isSelected}
                      className={cn(
                        "flex justify-center",
                        // A continuous band behind a highlighted run of days (e.g. a week).
                        highlightedSet.has(day) && "bg-brand-soft first:rounded-l-lg last:rounded-r-lg",
                      )}
                    >
                      <button
                        type="button"
                        data-day={day}
                        tabIndex={day === focused ? 0 : -1}
                        aria-label={`${formatLongDate(day)}${isToday ? ", today" : ""}`}
                        aria-current={isToday ? "date" : undefined}
                        onClick={() => onSelect(day)}
                        onFocus={() => setFocused(day)}
                        className={cn(
                          "relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-[13px] tabular-nums outline-none",
                          "transition-[background-color,color,box-shadow,transform] duration-150 active:scale-95",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          inMonth ? "text-foreground" : "text-subtle-foreground/60",
                          isSelected
                            ? "bg-brand font-semibold text-brand-foreground shadow-sm"
                            : isHighlighted
                              ? "text-foreground hover:bg-brand-soft"
                              : "hover:bg-hover",
                          isToday && !isSelected && "font-semibold text-brand-text",
                        )}
                      >
                        {Number(day.slice(8))}
                        {isToday && (
                          <span
                            aria-hidden
                            className={cn(
                              "absolute bottom-1.5 size-1 rounded-full",
                              isSelected ? "bg-brand-foreground/70" : "bg-brand",
                            )}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
