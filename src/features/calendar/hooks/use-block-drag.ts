"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { clampStartMinutes, SNAP_MINUTES, snapToGrid } from "../utils/calendar-layout";

export type BlockPosition = { dayIndex: number; startMinutes: number };

type BlockDragOptions = {
  position: BlockPosition;
  durationMinutes: number;
  dayCount: number;
  hourHeight: number;
  /** Width of one day column in pixels, measured when a drag starts. */
  getColumnWidth: () => number;
  onMove: (position: BlockPosition) => void;
  onActivate: () => void;
};

/** Pixels a pointer must travel before a press becomes a drag (vs. a click). */
const DRAG_THRESHOLD_PX = 4;
/** Keyboard moves are committed once the user pauses, not on every key press. */
const KEYBOARD_COMMIT_DELAY_MS = 600;

/**
 * Drag (mouse/pen) and keyboard (arrow keys) rescheduling for a calendar
 * block. While moving, the block renders at `preview`; the new position is
 * reported once, when the gesture ends. On touch screens a tap opens the
 * task instead, so scrolling the calendar never moves tasks by accident.
 */
export function useBlockDrag({
  position,
  durationMinutes,
  dayCount,
  hourHeight,
  getColumnWidth,
  onMove,
  onActivate,
}: BlockDragOptions) {
  const [preview, setPreview] = useState<BlockPosition | null>(null);
  const drag = useRef<{ x: number; y: number; columnWidth: number; moved: boolean } | null>(null);
  const keyboardCommitTimer = useRef<number | undefined>(undefined);
  // The browser fires "click" right after a drag's pointerup; this swallows it.
  const suppressNextClick = useRef(false);

  useEffect(() => () => window.clearTimeout(keyboardCommitTimer.current), []);

  function positionFor(minutesDelta: number, dayDelta: number): BlockPosition {
    return {
      dayIndex: Math.min(dayCount - 1, Math.max(0, position.dayIndex + dayDelta)),
      startMinutes: clampStartMinutes(snapToGrid(position.startMinutes + minutesDelta), durationMinutes),
    };
  }

  function commit(next: BlockPosition | null) {
    setPreview(null);
    if (!next) return;
    if (next.dayIndex !== position.dayIndex || next.startMinutes !== position.startMinutes) onMove(next);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || event.pointerType === "touch") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, columnWidth: getColumnWidth(), moved: false };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

    current.moved = true;
    const dayDelta = current.columnWidth > 0 ? Math.round(dx / current.columnWidth) : 0;
    setPreview(positionFor((dy / hourHeight) * 60, dayDelta));
  }

  function onPointerUp() {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    if (current.moved) {
      suppressNextClick.current = true;
      commit(preview);
    }
  }

  function onPointerCancel() {
    drag.current = null;
    setPreview(null);
  }

  function onClick() {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    onActivate();
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const base = preview ?? position;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-SNAP_MINUTES, 0],
      ArrowDown: [SNAP_MINUTES, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (event.key === "Escape" && preview) {
      event.preventDefault();
      window.clearTimeout(keyboardCommitTimer.current);
      setPreview(null);
      return;
    }

    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();

    const next: BlockPosition = {
      dayIndex: Math.min(dayCount - 1, Math.max(0, base.dayIndex + move[1])),
      startMinutes: clampStartMinutes(base.startMinutes + move[0], durationMinutes),
    };
    setPreview(next);
    window.clearTimeout(keyboardCommitTimer.current);
    keyboardCommitTimer.current = window.setTimeout(() => commit(next), KEYBOARD_COMMIT_DELAY_MS);
  }

  return {
    preview,
    isDragging: preview !== null,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick, onKeyDown },
  };
}
