import { getTasksForDay } from "@/features/tasks/services/task-service";
import { buildTasksWorkbook, getTasksExportFilename } from "@/features/tasks/utils/tasks-workbook";
import { getCurrentUserId } from "@/lib/auth/session";
import { getUserClock } from "@/lib/time-zone";

/** Downloads today's tasks (in the user's time zone) as an Excel workbook. */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const clock = await getUserClock();
  const tasks = await getTasksForDay(userId, clock.todayKey);
  const body = await buildTasksWorkbook(tasks, clock.timeZone);

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${getTasksExportFilename(clock.todayKey)}"`,
      "Cache-Control": "no-store",
    },
  });
}
