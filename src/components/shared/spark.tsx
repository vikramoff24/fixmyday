import type { SVGProps } from "react";

import { cn } from "@/lib/utils/cn";

/** The FixMyDay spark ✦ — marks anything the AI did. */
export function Spark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("size-4 shrink-0 text-brand", className)}
      {...props}
    >
      <path d="M12 1.5c.4 0 .7.3.8.7.6 3.2 1.4 5.2 2.7 6.4 1.2 1.2 3.2 2 6.4 2.6.4.1.6.4.6.8s-.3.7-.6.8c-3.2.6-5.2 1.4-6.4 2.6-1.3 1.2-2.1 3.2-2.7 6.4-.1.4-.4.7-.8.7s-.7-.3-.8-.7c-.6-3.2-1.4-5.2-2.7-6.4-1.2-1.2-3.2-2-6.4-2.6-.4-.1-.6-.4-.6-.8s.2-.7.6-.8c3.2-.6 5.2-1.4 6.4-2.6 1.3-1.2 2.1-3.2 2.7-6.4.1-.4.4-.7.8-.7Z" />
    </svg>
  );
}
