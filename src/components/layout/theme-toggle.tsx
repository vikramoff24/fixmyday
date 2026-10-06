"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function useToggleTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  return () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
}

export function ThemeToggle() {
  const toggleTheme = useToggleTheme();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Toggle theme">
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>
  );
}
