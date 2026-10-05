import { addDays, MINUTES_PER_DAY, startOfWeek, type DateKey } from "@/lib/utils/zoned-time";
import type { CalendarView } from "../schemas/calendar-params";

export const SNAP_MINUTES = 15;
/** Blocks shorter than this still get a readable height. */
export const MIN_BLOCK_MINUTES = 25;

export function getVisibleDays(view: CalendarView, date: DateKey): DateKey[] {
  if (view === "day") return [date];
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** The date one "page" before/after, for the previous/next buttons. */
export function shiftCalendarDate(view: CalendarView, date: DateKey, direction: 1 | -1): DateKey {
  return addDays(date, direction * (view === "day" ? 1 : 7));
}

export function snapToGrid(minutes: number, step = SNAP_MINUTES): number {
  return Math.round(minutes / step) * step;
}

/** Keeps a block of `duration` minutes inside the day. */
export function clampStartMinutes(minutes: number, duration: number): number {
  return Math.min(Math.max(0, minutes), MINUTES_PER_DAY - Math.min(duration, MINUTES_PER_DAY));
}

export type TimedBlock = { id: string; start: number; end: number };
export type PositionedBlock = { id: string; lane: number; laneCount: number };

/**
 * Side-by-side layout for overlapping blocks in one day column. Blocks are
 * grouped into clusters of transitive overlaps; within a cluster each block
 * takes the first free lane, and every block in the cluster shares the
 * cluster's lane count so widths line up.
 */
export function layoutDayBlocks(blocks: TimedBlock[]): Map<string, PositionedBlock> {
  const sorted = [...blocks].sort((a, b) => a.start - b.start || b.end - a.end);
  const result = new Map<string, PositionedBlock>();

  let cluster: { id: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  function closeCluster() {
    for (const item of cluster)
      result.set(item.id, { id: item.id, lane: item.lane, laneCount: laneEnds.length });
    cluster = [];
    laneEnds = [];
  }

  for (const block of sorted) {
    if (block.start >= clusterEnd) closeCluster();

    let lane = laneEnds.findIndex((end) => end <= block.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(block.end);
    } else {
      laneEnds[lane] = block.end;
    }

    cluster.push({ id: block.id, lane });
    clusterEnd = Math.max(clusterEnd, block.end);
  }
  closeCluster();

  return result;
}
