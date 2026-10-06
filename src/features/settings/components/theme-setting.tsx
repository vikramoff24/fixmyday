"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils/cn";

const OPTIONS = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
] as const;

const subscribeNoop = () => () => {};

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known in the browser; render neutrally on the server.
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  return (
    <div role="radiogroup" aria-label="Theme" className="flex gap-2">
      {OPTIONS.map((option) => {
        const checked = isClient && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors",
              checked ? "border-ring bg-selected" : "border-border hover:bg-hover",
            )}
          >
            <option.icon className="size-4" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
