"use client";

import { ArrowDown, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { Spark } from "@/components/shared/spark";
import { categoryDotClass } from "@/features/tasks/components/task-meta";
import { CATEGORY_LABELS, type TaskCategory } from "@/features/tasks/constants";
import { cn } from "@/lib/utils/cn";

type DemoScenario = {
  label: string;
  input: string;
  plan: { time: string; title: string; category: TaskCategory }[];
};

const SCENARIOS: DemoScenario[] = [
  {
    label: "Weeknight",
    input: "Need to finish PR, gym, groceries and study AI tonight.",
    plan: [
      { time: "18:00", title: "Finish PR", category: "work" },
      { time: "19:00", title: "Gym", category: "health" },
      { time: "20:30", title: "Groceries", category: "personal" },
      { time: "21:15", title: "AI learning", category: "learning" },
    ],
  },
  {
    label: "Busy Monday",
    input: "Team sync at 10, write the launch email, pay rent, run 5k and call Mom.",
    plan: [
      { time: "09:00", title: "Write the launch email", category: "work" },
      { time: "10:00", title: "Team sync", category: "work" },
      { time: "14:00", title: "Pay rent", category: "finance" },
      { time: "18:00", title: "Run 5k", category: "health" },
      { time: "19:15", title: "Call Mom", category: "personal" },
    ],
  },
  {
    label: "Weekend",
    input: "Saturday: yoga in the morning, clean the flat, read for an hour, dinner with Sam at 8.",
    plan: [
      { time: "09:00", title: "Yoga", category: "health" },
      { time: "10:15", title: "Clean the flat", category: "personal" },
      { time: "16:00", title: "Read", category: "learning" },
      { time: "20:00", title: "Dinner with Sam", category: "personal" },
    ],
  },
];

type Phase = "typing" | "thinking" | "planned";

const TYPING_MS_PER_CHARACTER = 28;
const THINKING_MS = 1100;

/**
 * A scripted, self-playing preview of the planner for the landing page.
 * It's illustrative: no AI call is made, so it's instant and free.
 */
export function LandingDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [run, setRun] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

  const scenario = SCENARIOS[scenarioIndex];
  const visibleLength = prefersReducedMotion ? scenario.input.length : typedLength;
  const visiblePhase: Phase = prefersReducedMotion ? "planned" : phase;

  function play(nextScenarioIndex: number) {
    setScenarioIndex(nextScenarioIndex);
    setTypedLength(0);
    setPhase("typing");
    setRun((value) => value + 1);
  }

  // Each run starts from a clean slate; the reset happens in the handlers
  // below so this effect only schedules the animation.
  useEffect(() => {
    if (prefersReducedMotion) return;

    const timers: number[] = [];
    for (let length = 1; length <= scenario.input.length; length++) {
      timers.push(window.setTimeout(() => setTypedLength(length), length * TYPING_MS_PER_CHARACTER));
    }
    const typingDone = scenario.input.length * TYPING_MS_PER_CHARACTER + 250;
    timers.push(window.setTimeout(() => setPhase("thinking"), typingDone));
    timers.push(window.setTimeout(() => setPhase("planned"), typingDone + THINKING_MS));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [scenario, run, prefersReducedMotion]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-center gap-1" role="tablist" aria-label="Example days">
        {SCENARIOS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={index === scenarioIndex}
            onClick={() => play(index)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
              index === scenarioIndex
                ? "bg-selected text-foreground"
                : "text-subtle-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border-strong bg-card/80 p-2 shadow-elevated backdrop-blur">
        <div className="flex min-h-[76px] items-start gap-3 rounded-xl bg-background/60 px-4 py-4">
          <Spark className="mt-0.5 size-[18px]" />
          <p className="text-[15px] leading-relaxed" aria-label={scenario.input}>
            <span aria-hidden>
              {scenario.input.slice(0, visibleLength)}
              {visiblePhase === "typing" && (
                <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-foreground" />
              )}
            </span>
          </p>
        </div>

        <div className="flex justify-center py-2 text-subtle-foreground" aria-hidden>
          <ArrowDown className="size-4" />
        </div>

        <div className="min-h-[236px] rounded-xl bg-background/60 px-2 py-3" aria-live="polite">
          <AnimatePresence mode="wait">
            {visiblePhase === "thinking" && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground"
              >
                <Spark className="animate-spark" />
                Understanding your day…
              </motion.div>
            )}
            {visiblePhase === "planned" && (
              <motion.ul key={`plan-${scenarioIndex}-${run}`} className="flex flex-col">
                {scenario.plan.map((item, index) => (
                  <motion.li
                    key={item.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.09, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-4 rounded-lg px-3 py-2.5"
                  >
                    <span className="w-12 font-mono text-[13px] text-muted-foreground tabular-nums">
                      {item.time}
                    </span>
                    <span className="flex-1 text-sm font-medium">{item.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("size-1.5 rounded-full", categoryDotClass[item.category])} />
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => play(scenarioIndex)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-subtle-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          Replay
        </button>
      </div>
    </div>
  );
}
