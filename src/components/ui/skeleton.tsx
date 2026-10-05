import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("shimmer rounded-md", className)} {...props} />;
}

export { Skeleton };
