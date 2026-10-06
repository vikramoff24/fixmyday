"use client";

import { useEffect, useEffectEvent } from "react";

/** True when the user is typing somewhere a bare key press should be left alone. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

/** Space and Enter already activate focused controls; never steal those presses. */
function isActivationKeyOnControl(event: KeyboardEvent): boolean {
  if (event.key !== " " && event.key !== "Enter") return false;
  if (!(event.target instanceof Element)) return false;
  return Boolean(
    event.target.closest(
      "button, a, summary, [role=button], [role=checkbox], [role=option], [role=menuitem], [role=tab]",
    ),
  );
}

type ShortcutOptions = {
  /** Require ⌘ (macOS) or Ctrl (elsewhere). Such shortcuts also work while typing. */
  withModifier?: boolean;
  enabled?: boolean;
};

/**
 * Global keyboard shortcut. Bare-key shortcuts ("n", "/") are ignored while
 * typing, inside open dialogs, and when any modifier is held, so they never
 * hijack normal text input or browser shortcuts.
 */
export function useKeyboardShortcut(
  key: string,
  onTrigger: (event: KeyboardEvent) => void,
  { withModifier = false, enabled = true }: ShortcutOptions = {},
) {
  const handleTrigger = useEffectEvent(onTrigger);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      const hasModifier = event.metaKey || event.ctrlKey;
      if (withModifier) {
        if (!hasModifier || event.altKey) return;
      } else {
        if (hasModifier || event.altKey) return;
        if (isTypingTarget(event.target) || isActivationKeyOnControl(event)) return;
        if (document.querySelector("[role=dialog][data-state=open]")) return;
      }

      event.preventDefault();
      handleTrigger(event);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, withModifier, enabled]);
}
