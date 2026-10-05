"use client";

import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

type SheetSide = "right" | "bottom" | "left";

const sideClasses: Record<SheetSide, string> = {
  right:
    "inset-y-2 right-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] max-w-md rounded-xl border data-[state=open]:slide-in-from-right-8 data-[state=closed]:slide-out-to-right-8",
  left: "inset-y-0 left-0 h-full w-72 border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  bottom:
    "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
};

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & { side?: SheetSide; showCloseButton?: boolean }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col border-border-strong bg-elevated shadow-elevated outline-none",
          "duration-300 ease-out-quint data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {side === "bottom" && (
          <div aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong" />
        )}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-3.5 right-3.5 cursor-pointer rounded-md p-1.5 text-subtle-foreground transition-colors hover:bg-hover hover:text-foreground">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("font-semibold tracking-tight", className)} {...props} />;
}

function SheetDescription({ className, ...props }: ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger };
