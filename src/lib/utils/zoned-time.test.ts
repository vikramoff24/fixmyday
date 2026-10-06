import { describe, expect, it } from "vitest";

import {
  addDays,
  daysBetween,
  formatMinutes,
  getDayRange,
  isValidDateKey,
  isValidTimeZone,
  minutesSinceMidnight,
  parseTime,
  startOfWeek,
  toDateKey,
  zonedToUtc,
} from "./zoned-time";

describe("zonedToUtc", () => {
  it("converts local wall-clock time to UTC", () => {
    expect(zonedToUtc("2026-10-05", 9 * 60 + 30, "America/New_York").toISOString()).toBe(
      "2026-10-05T13:30:00.000Z",
    );
    expect(zonedToUtc("2026-10-05", 9 * 60 + 30, "Asia/Kolkata").toISOString()).toBe(
      "2026-10-05T04:00:00.000Z",
    );
  });

  it("handles daylight-saving transitions", () => {
    // New York springs forward on 2026-03-08 and falls back on 2026-11-01.
    expect(zonedToUtc("2026-03-08", 12 * 60, "America/New_York").toISOString()).toBe(
      "2026-03-08T16:00:00.000Z",
    );
    expect(zonedToUtc("2026-11-01", 12 * 60, "America/New_York").toISOString()).toBe(
      "2026-11-01T17:00:00.000Z",
    );
  });

  it("round-trips with toDateKey and minutesSinceMidnight", () => {
    const instant = zonedToUtc("2026-12-31", 23 * 60 + 45, "Pacific/Auckland");
    expect(toDateKey(instant, "Pacific/Auckland")).toBe("2026-12-31");
    expect(minutesSinceMidnight(instant, "Pacific/Auckland")).toBe(23 * 60 + 45);
  });
});

describe("date keys", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-05", "2026-10-12")).toBe(7);
  });

  it("finds Monday as the start of the week", () => {
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05"); // Sunday → previous Monday
    expect(startOfWeek("2026-10-05")).toBe("2026-10-05");
  });

  it("validates date keys strictly", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2026-2-3")).toBe(false);
  });

  it("covers a whole local day", () => {
    const { start, end } = getDayRange("2026-10-05", "Europe/Berlin");
    expect(start.toISOString()).toBe("2026-10-04T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-05T22:00:00.000Z");
  });
});

describe("times", () => {
  it("parses and formats 24h times", () => {
    expect(parseTime("09:30")).toBe(570);
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("9:30")).toBeNull();
    expect(formatMinutes(570)).toBe("09:30");
    expect(formatMinutes(1440 + 15)).toBe("00:15");
  });

  it("recognises valid time zones only", () => {
    expect(isValidTimeZone("Europe/Paris")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});
