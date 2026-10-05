import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm transition-colors outline-none",
        "placeholder:text-subtle-foreground hover:border-border-strong",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none",
        "aria-invalid:border-destructive/70 aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:dark:invert",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
