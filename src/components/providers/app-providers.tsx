"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimeZoneSync } from "./time-zone-sync";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      {/* Honour the OS "reduce motion" setting for every Motion animation. */}
      <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
        <TooltipProvider>
          {children}
          <Toaster />
          <TimeZoneSync />
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
