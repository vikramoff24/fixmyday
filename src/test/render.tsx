import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Toaster } from "sonner";
import { vi } from "vitest";

import { AppShellContext, type AppShellActions } from "@/components/layout/app-shell-context";
import { ClockProvider } from "@/components/providers/clock-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export const TEST_CLOCK = { timeZone: "UTC", todayKey: "2026-10-05" };

export function createShellActions(): AppShellActions {
  return { openCommandPalette: vi.fn(), openNewTask: vi.fn(), openPlanner: vi.fn() };
}

/** Renders inside the same providers the dashboard uses. */
export function renderWithProviders(
  ui: ReactElement,
  { shell = createShellActions(), ...options }: { shell?: AppShellActions } & RenderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ClockProvider value={TEST_CLOCK}>
        <AppShellContext value={shell}>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </AppShellContext>
      </ClockProvider>
    );
  }
  return { shell, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** A promise you resolve from the test, to observe in-flight (optimistic) UI. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
