import { describe, expect, it } from "vitest";

import {
  clampStartMinutes,
  getVisibleDays,
  layoutDayBlocks,
  shiftCalendarDate,
  snapToGrid,
} from "./calendar-layout";

describe("getVisibleDays", () => {
  it("returns Monday to Sunday for the week containing the date", () => {
    // 2026-10-08 is a Thursday.
    expect(getVisibleDays("week", "2026-10-08")).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
  });

  it("returns just the date in day view", () => {
    expect(getVisibleDays("day", "2026-10-08")).toEqual(["2026-10-08"]);
  });
});

describe("shiftCalendarDate", () => {
  it("moves by a week or a day", () => {
    expect(shiftCalendarDate("week", "2026-10-08", 1)).toBe("2026-10-15");
    expect(shiftCalendarDate("day", "2026-10-01", -1)).toBe("2026-09-30");
  });
});

describe("snapToGrid / clampStartMinutes", () => {
  it("snaps to quarter hours", () => {
    expect(snapToGrid(9 * 60 + 7)).toBe(9 * 60);
    expect(snapToGrid(9 * 60 + 8)).toBe(9 * 60 + 15);
  });

  it("keeps blocks inside the day", () => {
    expect(clampStartMinutes(-30, 60)).toBe(0);
    expect(clampStartMinutes(23 * 60 + 30, 60)).toBe(23 * 60);
  });
});

describe("layoutDayBlocks", () => {
  it("gives non-overlapping blocks the full width", () => {
    const layout = layoutDayBlocks([
      { id: "a", start: 540, end: 600 },
      { id: "b", start: 600, end: 660 },
    ]);
    expect(layout.get("a")).toEqual({ id: "a", lane: 0, laneCount: 1 });
    expect(layout.get("b")).toEqual({ id: "b", lane: 0, laneCount: 1 });
  });

  it("puts overlapping blocks side by side and reuses free lanes", () => {
    const layout = layoutDayBlocks([
      { id: "long", start: 540, end: 720 },
      { id: "first", start: 560, end: 600 },
      { id: "second", start: 620, end: 680 },
    ]);
    expect(layout.get("long")).toMatchObject({ lane: 0, laneCount: 2 });
    expect(layout.get("first")).toMatchObject({ lane: 1, laneCount: 2 });
    expect(layout.get("second")).toMatchObject({ lane: 1, laneCount: 2 });
  });
});
