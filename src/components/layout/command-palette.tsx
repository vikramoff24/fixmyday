"use client";

import { MoonStar, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Spark } from "@/components/shared/spark";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { askNavHref, primaryNavigation, settingsNavItem } from "@/config/navigation";
import { useToggleTheme } from "./theme-toggle";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: () => void;
  onPlan: () => void;
};

export function CommandPalette({ open, onOpenChange, onCreateTask, onPlan }: CommandPaletteProps) {
  const router = useRouter();
  const toggleTheme = useToggleTheme();
  const [query, setQuery] = useState("");

  function run(action: () => void) {
    onOpenChange(false);
    setQuery("");
    action();
  }

  const trimmedQuery = query.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-xl overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">Search for a command or a page.</DialogDescription>
        <Command loop>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No matching commands.</CommandEmpty>

            {trimmedQuery && (
              <CommandGroup heading="Search">
                <CommandItem
                  value={`search tasks ${trimmedQuery}`}
                  onSelect={() =>
                    run(() => router.push(`/tasks?view=all&q=${encodeURIComponent(trimmedQuery)}`))
                  }
                >
                  <Search />
                  Search tasks for “{trimmedQuery}”
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup heading="Actions">
              <CommandItem value="create new task" onSelect={() => run(onCreateTask)}>
                <Plus />
                Create task
                <Kbd className="ml-auto">N</Kbd>
              </CommandItem>
              <CommandItem value="plan my day with ai organize" onSelect={() => run(onPlan)}>
                <Spark />
                Plan with AI
              </CommandItem>
              <CommandItem
                value="ask ai assistant prioritize"
                onSelect={() => run(() => router.push(askNavHref))}
              >
                <Spark />
                Ask AI
              </CommandItem>
              <CommandItem
                value="search tasks find"
                onSelect={() => run(() => router.push("/tasks?focus=search"))}
              >
                <Search />
                Search tasks
                <Kbd className="ml-auto">/</Kbd>
              </CommandItem>
              <CommandItem value="toggle theme dark light mode" onSelect={() => run(toggleTheme)}>
                <MoonStar />
                Toggle theme
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Go to">
              {[...primaryNavigation, settingsNavItem].map((item) => (
                <CommandItem
                  key={item.href}
                  value={`go to ${item.label}`}
                  onSelect={() => run(() => router.push(item.href))}
                >
                  <item.icon />
                  Go to {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
