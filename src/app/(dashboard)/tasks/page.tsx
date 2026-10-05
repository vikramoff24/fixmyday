import type { Metadata } from "next";

import { TasksView } from "@/features/tasks/components/tasks-view";
import { parseTaskFilters } from "@/features/tasks/schemas/task-filters";
import { searchTasks } from "@/features/tasks/services/task-service";
import { requireUserIdOrRedirect } from "@/lib/auth/session";
import type { SearchParams } from "@/types";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const userId = await requireUserIdOrRedirect();
  const params = await searchParams;
  const filters = parseTaskFilters(params);
  const tasks = await searchTasks(userId, filters);

  return <TasksView tasks={tasks} filters={filters} autoFocusSearch={params.focus === "search"} />;
}
