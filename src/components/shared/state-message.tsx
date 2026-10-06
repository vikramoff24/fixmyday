import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { Spark } from "./spark";

type StateMessageProps = {
  title: string;
  description?: ReactNode;
  /** Defaults to the brand spark. */
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: "default" | "error";
};

/**
 * Shared layout for empty and error states, so every "nothing here" and
 * "something broke" moment looks intentional and consistent.
 */
export function StateMessage({
  title,
  description,
  icon,
  action,
  className,
  tone = "default",
}: StateMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn("flex flex-col items-center px-6 py-14 text-center", className)}
    >
      <div
        className={cn(
          "mb-4 flex size-10 items-center justify-center rounded-full",
          tone === "error" ? "bg-destructive/10 text-destructive" : "bg-brand-soft",
        )}
      >
        {icon ?? <Spark className="size-[18px]" />}
      </div>
      <p className="text-[15px] font-medium tracking-tight">{title}</p>
      {description && (
        <div className="mt-1.5 max-w-xs text-sm text-balance text-muted-foreground">{description}</div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
