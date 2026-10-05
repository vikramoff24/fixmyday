"use client";

import { createContext, useContext } from "react";

export type AppShellActions = {
  openCommandPalette: () => void;
  openNewTask: () => void;
  /** Opens the AI planner in a sheet (used where it isn't inline, e.g. mobile). */
  openPlanner: () => void;
};

export const AppShellContext = createContext<AppShellActions | null>(null);

export function useAppShell(): AppShellActions {
  const actions = useContext(AppShellContext);
  if (!actions) throw new Error("useAppShell must be used inside <AppShell>.");
  return actions;
}
