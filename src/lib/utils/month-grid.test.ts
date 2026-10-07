import { describe, expect, it } from "vitest";

import { addMonths, getMonthGrid, isSameMonth, startOfMonth } from "./month-grid";

describe("month grid", () => {
  it("finds the first of the month", () => {
    expect(startOfMonth("2026-10-17")).toBe("2026-10-01");
  });

  it("compares months", () => {
    expect(isSameMonth("2026-10-01", "2026-10-31")).toBe(true);
    expect(isSameMonth("2026-10-31", "2026-11-01")).toBe(false);
  });

  it("adds months across year boundaries and clamps the day", () => {
    expect(addMonths("2026-10-17", 1)).toBe("2026-11-17");
    expect(addMonths("2026-12-05", 1)).toBe("2027-01-05");
    expect(addMonths("2026-01-05", -1)).toBe("2025-12-05");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-03-31", -1)).toBe("2028-02-29");
  });

  it("returns six Monday-first weeks covering the month", () => {
    const grid = getMonthGrid("2026-10-17");
    expect(grid).toHaveLength(42);
    // October 1st 2026 is a Thursday, so the grid starts on Monday Sep 28.
    expect(grid[0]).toBe("2026-09-28");
    expect(grid).toContain("2026-10-31");
    expect(grid[41]).toBe("2026-11-08");
  });
});
