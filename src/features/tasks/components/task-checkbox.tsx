"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils/cn";

type TaskCheckboxProps = {
  checked: boolean;
  onCheckedChange: () => void;
  label: string;
  className?: string;
};

/** Round completion toggle with a quick, satisfying check animation. */
export function TaskCheckbox({ checked, onCheckedChange, label, className }: TaskCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? `Mark “${label}” as not done` : `Mark “${label}” as done`}
      onClick={(event) => {
        event.stopPropagation();
        onCheckedChange();
      }}
      className={cn(
        // The visible circle is small; the padding keeps the touch target comfortable.
        "group/check relative -m-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-[18px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-200",
          checked
            ? "border-success bg-success"
            : "border-subtle-foreground group-hover/check:border-muted-foreground",
        )}
      >
        <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
          <motion.path
            d="M4 8.5 6.8 11 12 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-background"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
        </svg>
      </span>
    </button>
  );
}
