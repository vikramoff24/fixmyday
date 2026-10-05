"use client";

import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl bg-elevated text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex h-12 items-center gap-2.5 border-b border-border px-4">
      <SearchIcon className="size-4 shrink-0 text-subtle-foreground" />
      <CommandPrimitive.Input
        className={cn(
          "flex h-full w-full bg-transparent text-[15px] outline-none placeholder:text-subtle-foreground disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-[min(420px,60vh)] scroll-py-2 overflow-x-hidden overflow-y-auto p-2", className)}
      {...props}
    />
  );
}

function CommandEmpty(props: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="py-8 text-center text-sm text-muted-foreground" {...props} />;
}

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-subtle-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex h-10 cursor-pointer items-center gap-3 rounded-md px-2.5 text-sm outline-none select-none",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-selected",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({ className, ...props }: ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator className={cn("-mx-2 my-1 h-px bg-border", className)} {...props} />;
}

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator };
