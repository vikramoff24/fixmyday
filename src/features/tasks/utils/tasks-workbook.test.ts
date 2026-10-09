import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { buildTask } from "@/test/factories";
import { buildTasksWorkbook, getTasksExportFilename } from "./tasks-workbook";

describe("buildTasksWorkbook", () => {
  it("writes a header row and one row per task with every field", async () => {
    const task = buildTask({
      title: "Write report",
      description: "Q3 numbers",
      category: "work",
      priority: "high",
      status: "in_progress",
      dueDate: "2026-10-09",
      scheduledStart: new Date("2026-10-09T13:30:00Z"),
      estimatedMinutes: 45,
      tags: ["finance", "q3"],
    });

    const bytes = await buildTasksWorkbook([task], "America/New_York");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
    const sheet = workbook.getWorksheet("Tasks")!;

    expect(sheet.rowCount).toBe(2);
    expect((sheet.getRow(1).values as unknown[]).slice(1, 6)).toEqual([
      "Title",
      "Description",
      "Category",
      "Priority",
      "Status",
    ]);
    expect((sheet.getRow(2).values as unknown[]).slice(1, 10)).toEqual([
      "Write report",
      "Q3 numbers",
      "Work",
      "High",
      "In progress",
      "2026-10-09",
      "2026-10-09 09:30",
      45,
      "finance, q3",
    ]);
  });

  it("names the file after the day", () => {
    expect(getTasksExportFilename("2026-10-09")).toBe("tasks-2026-10-09.xlsx");
  });
});
