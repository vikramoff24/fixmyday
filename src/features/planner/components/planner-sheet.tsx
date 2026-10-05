"use client";

import { Spark } from "@/components/shared/spark";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { MOBILE_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import { PlannerPanel } from "./planner-panel";

type PlannerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The planner as an overlay, reachable from anywhere (mobile FAB, ⌘K). */
export function PlannerSheet({ open, onOpenChange }: PlannerSheetProps) {
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className="overflow-y-auto md:max-w-xl">
        <div className="flex flex-col gap-5 px-5 pt-5 pb-8">
          <div className="flex items-center gap-2 pr-8">
            <Spark className="size-[18px]" />
            <SheetTitle>Plan with AI</SheetTitle>
          </div>
          <SheetDescription className="-mt-3">
            Tell me everything on your mind. I&apos;ll turn it into a realistic plan.
          </SheetDescription>
          <PlannerPanel autoFocus onAccepted={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
