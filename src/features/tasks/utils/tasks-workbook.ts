import "server-only";
import ExcelJS from "exceljs";

import { formatMinutes, minutesSinceMidnight, toDateKey, type DateKey } from "@/lib/utils/zoned-time";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "../constants";
import type { Task } from "../types";

/** Instants are written as local wall-clock text so the sheet matches what the app shows. */
function formatInstant(instant: Date | null, timeZone: string): string {
  if (!instant) return "";
  return `${toDateKey(instant, timeZone)} ${formatMinutes(minutesSinceMidnight(instant, timeZone))}`;
}

const COLUMNS: { header: string; width: number; value: (task: Task, timeZone: string) => string | number }[] =
  [
    { header: "Title", width: 40, value: (task) => task.title },
    { header: "Description", width: 50, value: (task) => task.description ?? "" },
    { header: "Category", width: 12, value: (task) => CATEGORY_LABELS[task.category] },
    { header: "Priority", width: 10, value: (task) => PRIORITY_LABELS[task.priority] },
    { header: "Status", width: 13, value: (task) => STATUS_LABELS[task.status] },
    { header: "Due date", width: 12, value: (task) => task.dueDate ?? "" },
    { header: "Start", width: 18, value: (task, tz) => formatInstant(task.scheduledStart, tz) },
    { header: "Estimated minutes", width: 18, value: (task) => task.estimatedMinutes ?? "" },
    { header: "Tags", width: 24, value: (task) => task.tags.join(", ") },
    { header: "Completed at", width: 18, value: (task, tz) => formatInstant(task.completedAt, tz) },
    { header: "Created at", width: 18, value: (task, tz) => formatInstant(task.createdAt, tz) },
    { header: "Updated at", width: 18, value: (task, tz) => formatInstant(task.updatedAt, tz) },
    { header: "Plan ID", width: 38, value: (task) => task.planId ?? "" },
    { header: "Task ID", width: 38, value: (task) => task.id },
  ];

export function getTasksExportFilename(dateKey: DateKey): string {
  return `tasks-${dateKey}.xlsx`;
}

/** Builds an .xlsx workbook with one row per task and every user-facing task field. */
export async function buildTasksWorkbook(tasks: Task[], timeZone: string): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tasks", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = COLUMNS.map(({ header, width }) => ({ header, width }));
  sheet.getRow(1).font = { bold: true };
  for (const task of tasks) {
    sheet.addRow(COLUMNS.map((column) => column.value(task, timeZone)));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
