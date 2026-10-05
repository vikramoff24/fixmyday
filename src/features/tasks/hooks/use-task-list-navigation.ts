"use client";

import { useState } from "react";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import type { Task } from "../types";

type TaskListNavigationOptions = {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onOpen: (task: Task) => void;
  enabled?: boolean;
};

/**
 * Keyboard control for a task list: J/K or ↑/↓ move the selection, Space
 * completes the selected task and Enter opens it. Shortcuts are inactive
 * while typing or when a dialog is open (see useKeyboardShortcut).
 */
export function useTaskListNavigation({
  tasks,
  onToggleComplete,
  onOpen,
  enabled = true,
}: TaskListNavigationOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTask = tasks.find((task) => task.id === selectedId) ?? null;

  function move(step: 1 | -1) {
    if (tasks.length === 0) return;
    const currentIndex = tasks.findIndex((task) => task.id === selectedId);
    const nextIndex =
      currentIndex === -1
        ? step === 1
          ? 0
          : tasks.length - 1
        : Math.min(tasks.length - 1, Math.max(0, currentIndex + step));
    const nextTask = tasks[nextIndex];
    setSelectedId(nextTask.id);
    document.getElementById(`task-${nextTask.id}`)?.scrollIntoView({ block: "nearest" });
  }

  useKeyboardShortcut("j", () => move(1), { enabled });
  useKeyboardShortcut("ArrowDown", () => move(1), { enabled });
  useKeyboardShortcut("k", () => move(-1), { enabled });
  useKeyboardShortcut("ArrowUp", () => move(-1), { enabled });
  useKeyboardShortcut(" ", () => selectedTask && onToggleComplete(selectedTask), {
    enabled: enabled && selectedTask !== null,
  });
  useKeyboardShortcut("Enter", () => selectedTask && onOpen(selectedTask), {
    enabled: enabled && selectedTask !== null,
  });

  return { selectedId, setSelectedId };
}
