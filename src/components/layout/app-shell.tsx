"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { PlannerSheet } from "@/features/planner/components/planner-sheet";
import { NewTaskDialog } from "@/features/tasks/components/new-task-dialog";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { AppShellContext, type AppShellActions } from "./app-shell-context";
import { CommandPalette } from "./command-palette";
import { MobileHeader, MobileTabBar } from "./mobile-nav";
import { Sidebar } from "./sidebar";

/** ID of the search field on the Tasks page, focused by the "/" shortcut. */
export const TASK_SEARCH_INPUT_ID = "task-search";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isNewTaskOpen, setNewTaskOpen] = useState(false);
  const [isPlannerOpen, setPlannerOpen] = useState(false);

  const actions: AppShellActions = {
    openCommandPalette: () => setPaletteOpen(true),
    openNewTask: () => setNewTaskOpen(true),
    openPlanner: () => setPlannerOpen(true),
  };

  useKeyboardShortcut("k", () => setPaletteOpen((open) => !open), { withModifier: true });
  useKeyboardShortcut("n", () => setNewTaskOpen(true));
  useKeyboardShortcut("/", () => {
    const searchInput = document.getElementById(TASK_SEARCH_INPUT_ID);
    if (searchInput) searchInput.focus();
    else router.push("/tasks?focus=search");
  });

  return (
    <AppShellContext value={actions}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-elevated px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <main id="main" className="flex-1 pb-28 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <MobileTabBar />

      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setPaletteOpen}
        onCreateTask={() => setNewTaskOpen(true)}
        onPlan={() => setPlannerOpen(true)}
      />
      <NewTaskDialog open={isNewTaskOpen} onOpenChange={setNewTaskOpen} />
      <PlannerSheet open={isPlannerOpen} onOpenChange={setPlannerOpen} />
    </AppShellContext>
  );
}
