import type { Metadata } from "next";

import { getOverdueTasks, getTasksForDay } from "@/features/tasks/services/task-service";
import { TodayView } from "@/features/tasks/components/today-view";
import { requireUserIdOrRedirect } from "@/lib/auth/session";
import { getUserClock } from "@/lib/time-zone";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const userId = await requireUserIdOrRedirect();
  const clock = await getUserClock();

  const [todaysTasks, overdueTasks] = await Promise.all([
    getTasksForDay(userId, clock.todayKey),
    getOverdueTasks(userId, clock.todayKey),
  ]);

  return <TodayView tasks={[...overdueTasks, ...todaysTasks]} initialNowMinutes={clock.nowMinutes} />;
}
