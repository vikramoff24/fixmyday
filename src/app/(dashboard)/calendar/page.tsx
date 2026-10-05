import type { Metadata } from "next";

import { CalendarView } from "@/features/calendar/components/calendar-view";
import { parseCalendarParams } from "@/features/calendar/schemas/calendar-params";
import { getVisibleDays } from "@/features/calendar/utils/calendar-layout";
import { getTasksForDates } from "@/features/tasks/services/task-service";
import { requireUserIdOrRedirect } from "@/lib/auth/session";
import { getUserClock } from "@/lib/time-zone";
import type { SearchParams } from "@/types";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const userId = await requireUserIdOrRedirect();
  const clock = await getUserClock();
  const { view, date } = parseCalendarParams(await searchParams, clock.todayKey);

  const days = getVisibleDays(view, date);
  const tasks = await getTasksForDates(userId, days[0], days[days.length - 1]);

  return <CalendarView view={view} date={date} tasks={tasks} initialNowMinutes={clock.nowMinutes} />;
}
