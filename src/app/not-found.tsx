import Link from "next/link";

import { StateMessage } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <StateMessage
        title="This page doesn't exist."
        description="It may have moved, or the link might be wrong."
        action={
          <Button asChild variant="secondary">
            <Link href="/today">Back to today</Link>
          </Button>
        }
      />
    </div>
  );
}
