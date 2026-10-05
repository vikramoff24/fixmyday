"use client";

import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("text-[13px] font-medium text-muted-foreground select-none", className)}
      {...props}
    />
  );
}

export { Label };
