"use client";

import { RotateCcw } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { StateMessage } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { usePlanner } from "../hooks/use-planner";
import { PlanDraftView } from "./plan-draft-view";
import { PlannerInput } from "./planner-input";
import { PlannerThinking } from "./planner-thinking";

type PlannerPanelProps = {
  inputId?: string;
  autoFocus?: boolean;
  className?: string;
  onAccepted?: (count: number) => void;
};

const BUSY_LABELS = { accepting: "Saving your plan…", reorganizing: "Reorganizing…" } as const;

/** Thoughts → AI → Plan → Action, in one self-contained component. */
export function PlannerPanel({ inputId, autoFocus, className, onAccepted }: PlannerPanelProps) {
  const planner = usePlanner({ onAccepted });
  const { state } = planner;
  const isThinking = state.status === "thinking";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {state.status !== "draft" && (
        <PlannerInput
          inputId={inputId}
          value={planner.input}
          onChange={planner.setInput}
          onSubmit={planner.submit}
          disabled={isThinking}
          autoFocus={autoFocus}
          showExamples={state.status === "idle"}
        />
      )}

      <AnimatePresence mode="wait">
        {isThinking && <PlannerThinking key="thinking" />}

        {state.status === "error" && (
          <div key="error" className="rounded-xl border border-border bg-card/60">
            <StateMessage
              tone="error"
              className="py-8"
              title="We couldn't organize your plan."
              description={state.message}
              action={
                <Button variant="secondary" size="sm" onClick={planner.submit}>
                  <RotateCcw />
                  Try again
                </Button>
              }
            />
          </div>
        )}

        {state.status === "draft" && (
          <PlanDraftView
            key="draft"
            draft={state.draft}
            isEditing={state.isEditing}
            isBusy={planner.busyAction !== null}
            busyLabel={planner.busyAction ? BUSY_LABELS[planner.busyAction] : null}
            onToggleEdit={planner.toggleEditing}
            onChangeTask={planner.changeTask}
            onRemoveTask={planner.removeTask}
            onAccept={planner.accept}
            onReorganize={planner.reorganize}
            onDiscard={planner.reset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
