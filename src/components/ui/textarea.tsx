import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none",
        "placeholder:text-subtle-foreground hover:border-border-strong",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/70",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
