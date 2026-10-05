"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { acceptPlanDraftAction, createPlanDraftAction, reorganizePlanDraftAction } from "../actions";
import type { PlanDraft, PlanTaskDraft } from "../types";
import { comparePlanDrafts } from "../utils/schedule-plan";

export type PlannerState =
  | { status: "idle" }
  | { status: "thinking" }
  | { status: "draft"; draft: PlanDraft; isEditing: boolean }
  | { status: "error"; message: string };

type BusyAction = "accepting" | "reorganizing" | null;

/**
 * State for the capture → draft → accept flow. Nothing is written to the
 * user's tasks until they explicitly accept the plan.
 */
export function usePlanner({ onAccepted }: { onAccepted?: (count: number) => void } = {}) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<PlannerState>({ status: "idle" });
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [, startTransition] = useTransition();
  // Guards against double submits (Enter + click, or rapid re-submits) so
  // one thought never creates two AI plans.
  const requestInFlight = useRef(false);

  function submit() {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setState({ status: "thinking" });

    startTransition(async () => {
      const result = await createPlanDraftAction(input);
      requestInFlight.current = false;

      if (!result.ok) {
        setState({ status: "error", message: result.error });
        return;
      }
      if (result.data.tasks.length === 0) {
        setState({
          status: "error",
          message: "I couldn't find anything to plan in that. Try listing what you need to do.",
        });
        return;
      }
      setState({ status: "draft", draft: result.data, isEditing: false });
    });
  }

  function updateDraft(update: (draft: PlanDraft) => PlanDraft) {
    setState((current) =>
      current.status === "draft" ? { ...current, draft: update(current.draft) } : current,
    );
  }

  function changeTask(changed: PlanTaskDraft) {
    updateDraft((draft) => ({
      ...draft,
      tasks: draft.tasks.map((task) => (task.key === changed.key ? changed : task)),
    }));
  }

  function removeTask(key: string) {
    updateDraft((draft) => ({ ...draft, tasks: draft.tasks.filter((task) => task.key !== key) }));
  }

  function toggleEditing() {
    setState((current) => {
      if (current.status !== "draft") return current;
      // Leaving edit mode re-sorts rows so the list reflects any new times.
      const tasks = current.isEditing
        ? [...current.draft.tasks].sort(comparePlanDrafts)
        : current.draft.tasks;
      return { ...current, isEditing: !current.isEditing, draft: { ...current.draft, tasks } };
    });
  }

  function reorganize() {
    if (state.status !== "draft") return;
    const draft = state.draft;
    setBusyAction("reorganizing");
    startTransition(async () => {
      const result = await reorganizePlanDraftAction(draft);
      setBusyAction(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setState({ status: "draft", draft: result.data, isEditing: false });
    });
  }

  function accept() {
    if (state.status !== "draft") return;
    const draft = state.draft;
    setBusyAction("accepting");
    startTransition(async () => {
      const result = await acceptPlanDraftAction(draft);
      setBusyAction(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const count = result.data.length;
      toast.success(`Added ${count} ${count === 1 ? "task" : "tasks"} to your plan`);
      setInput("");
      setState({ status: "idle" });
      onAccepted?.(count);
    });
  }

  function reset() {
    setState({ status: "idle" });
  }

  return {
    input,
    setInput,
    state,
    busyAction,
    submit,
    changeTask,
    removeTask,
    toggleEditing,
    reorganize,
    accept,
    reset,
  };
}
