import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-strong bg-hover px-1 font-sans text-[11px] font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
