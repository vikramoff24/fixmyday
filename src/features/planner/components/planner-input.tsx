"use client";

import { ArrowUp } from "lucide-react";
import { useRef, type FormEvent } from "react";

import { Spark } from "@/components/shared/spark";
import { Button } from "@/components/ui/button";
import { PLANNER_INPUT_ID } from "@/config/dom-ids";
import { cn } from "@/lib/utils/cn";
import { PLANNER_INPUT_MAX_LENGTH } from "../schemas/plan-schemas";

const EXAMPLES = [
  "Finish my PR, gym after work and call Mom",
  "Tomorrow: team sync at 10, groceries, 1 hour learning AI",
  "Pay rent and book the dentist before Friday",
];

type PlannerInputProps = {
  inputId?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  showExamples?: boolean;
  className?: string;
};

/** The signature capture field: type everything on your mind, press Enter. */
export function PlannerInput({
  inputId = PLANNER_INPUT_ID,
  value,
  onChange,
  onSubmit,
  disabled = false,
  autoFocus = false,
  showExamples = true,
  className,
}: PlannerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = value.trim().length >= 3 && !disabled;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) onSubmit();
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "group relative rounded-xl border border-border-strong bg-card shadow-input transition-[border-color,box-shadow] duration-200",
          "focus-within:border-brand/50 focus-within:shadow-[0_0_0_4px_var(--brand-soft)]",
        )}
        onClick={() => textareaRef.current?.focus()}
      >
        <Spark className="pointer-events-none absolute top-[18px] left-4 size-[18px]" />
        <label htmlFor={inputId} className="sr-only">
          What&apos;s on your mind?
        </label>
        <textarea
          ref={textareaRef}
          id={inputId}
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          maxLength={PLANNER_INPUT_MAX_LENGTH}
          rows={1}
          placeholder="What's on your mind?"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // Enter plans; Shift+Enter adds a line for longer brain dumps.
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (canSubmit) onSubmit();
            }
          }}
          className="field-sizing-content max-h-60 min-h-[60px] w-full resize-none bg-transparent py-[17px] pr-16 pl-12 text-[15px] leading-relaxed outline-none placeholder:text-subtle-foreground disabled:opacity-60"
        />
        <Button
          type="submit"
          variant="brand"
          size="icon-sm"
          disabled={!canSubmit}
          aria-label="Plan it"
          className="absolute right-3 bottom-3 rounded-lg disabled:bg-hover disabled:text-subtle-foreground disabled:opacity-100"
        >
          <ArrowUp />
        </Button>
      </form>

      {showExamples && value.length === 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Examples">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                onChange(example);
                textareaRef.current?.focus();
              }}
              className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
