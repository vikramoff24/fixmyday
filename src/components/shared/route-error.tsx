"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { StateMessage } from "./state-message";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
};

/** Friendly error boundary content. Details go to the console, never the screen. */
export function RouteError({ error, reset, title = "Something went wrong." }: RouteErrorProps) {
  useEffect(() => {
    console.error("[route-error]", error.digest ?? "", error);
  }, [error]);

  return (
    <StateMessage
      tone="error"
      icon={<AlertTriangle className="size-[18px]" />}
      title={title}
      description="We couldn't load this right now. Please try again."
      action={
        <Button variant="secondary" onClick={reset}>
          <RotateCcw />
          Try again
        </Button>
      }
      className="py-24"
    />
  );
}
