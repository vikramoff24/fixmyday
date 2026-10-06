"use client";

import { UserButton } from "@clerk/nextjs";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isClerkEnabled } from "@/config/features";

export function UserMenu() {
  if (isClerkEnabled) {
    return <UserButton appearance={{ elements: { avatarBox: "size-7" } }} />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text"
          aria-label="Local development user"
        >
          D
        </span>
      </TooltipTrigger>
      <TooltipContent>Local dev user — add Clerk keys to enable sign-in</TooltipContent>
    </Tooltip>
  );
}
