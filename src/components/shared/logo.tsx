import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { Spark } from "./spark";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight", className)}
    >
      <Spark className="size-[18px]" />
      {siteConfig.name}
    </span>
  );
}
