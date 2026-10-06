// @vitest-environment jsdom
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildTask } from "@/test/factories";
import { deferred, renderWithProviders } from "@/test/render";
import { TodayView } from "./today-view";

const actions = vi.hoisted(() => ({
  updateTaskAction: vi.fn(),
  deleteTaskAction: vi.fn(),
  restoreTaskAction: vi.fn(),
  rescheduleTaskAction: vi.fn(),
  createTaskAction: vi.fn(),
}));
vi.mock("../actions", () => actions);
// The inline planner has its own tests; keep this view's tests focused.
vi.mock("@/features/planner/components/planner-panel", () => ({ PlannerPanel: () => null }));

const prTask = buildTask({
  title: "Finish PR",
  category: "work",
  priority: "high",
  dueDate: "2026-10-05",
  scheduledStart: new Date("2026-10-05T09:30:00Z"),
  estimatedMinutes: 45,
});
const gymTask = buildTask({ title: "Gym", category: "health", dueDate: "2026-10-05" });

describe("TodayView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an inviting empty state", () => {
    renderWithProviders(<TodayView tasks={[]} initialNowMinutes={8 * 60} />);
    expect(screen.getByText("Nothing planned yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start planning" })).toBeInTheDocument();
  });

  it("lists today's tasks with times and progress", () => {
    renderWithProviders(<TodayView tasks={[prTask, gymTask]} initialNowMinutes={8 * 60} />);
    expect(screen.getByText("Here's your plan for Monday, October 5.")).toBeInTheDocument();
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(
      within(screen.getByRole("region", { name: "Anytime today" })).getByText("Gym"),
    ).toBeInTheDocument();
  });

  it("completes a task instantly, before the server responds", async () => {
    const user = userEvent.setup();
    const response = deferred<unknown>();
    actions.updateTaskAction.mockReturnValue(response.promise);
    renderWithProviders(<TodayView tasks={[prTask, gymTask]} initialNowMinutes={8 * 60} />);

    await user.click(screen.getByRole("checkbox", { name: "Mark “Finish PR” as done" }));

    expect(screen.getByRole("checkbox", { name: "Mark “Finish PR” as not done" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(actions.updateTaskAction).toHaveBeenCalledWith({
      id: prTask.id,
      changes: { status: "completed" },
    });

    await act(async () => response.resolve({ ok: true, data: prTask }));
  });

  it("reverts and explains when saving fails", async () => {
    const user = userEvent.setup();
    actions.updateTaskAction.mockResolvedValue({
      ok: false,
      error: "We couldn't find that task.",
      code: "NOT_FOUND",
    });
    renderWithProviders(<TodayView tasks={[prTask]} initialNowMinutes={8 * 60} />);

    await user.click(screen.getByRole("checkbox", { name: "Mark “Finish PR” as done" }));

    expect(await screen.findByText("We couldn't find that task.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Mark “Finish PR” as done" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("edits a task in the detail panel", async () => {
    const user = userEvent.setup();
    actions.updateTaskAction.mockResolvedValue({ ok: true, data: prTask });
    renderWithProviders(<TodayView tasks={[prTask]} initialNowMinutes={8 * 60} />);

    await user.click(screen.getByRole("button", { name: /Finish PR/ }));
    const title = await screen.findByLabelText("Task title");
    await user.clear(title);
    await user.type(title, "Finish and merge PR{Enter}");

    await waitFor(() =>
      expect(actions.updateTaskAction).toHaveBeenCalledWith({
        id: prTask.id,
        changes: { title: "Finish and merge PR" },
      }),
    );
  });

  it("deletes a task and can undo it", async () => {
    const user = userEvent.setup();
    actions.deleteTaskAction.mockResolvedValue({ ok: true, data: prTask });
    actions.restoreTaskAction.mockResolvedValue({ ok: true, data: prTask });
    renderWithProviders(<TodayView tasks={[prTask]} initialNowMinutes={8 * 60} />);

    await user.click(screen.getByRole("button", { name: /Finish PR/ }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(actions.deleteTaskAction).toHaveBeenCalledWith({ id: prTask.id });
    expect(await screen.findByText("Task deleted")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(actions.restoreTaskAction).toHaveBeenCalledWith(
        expect.objectContaining({ id: prTask.id, title: "Finish PR" }),
      ),
    );
  });

  it("supports keyboard: J to select, Space to complete", async () => {
    const user = userEvent.setup();
    actions.updateTaskAction.mockResolvedValue({ ok: true, data: prTask });
    renderWithProviders(<TodayView tasks={[prTask, gymTask]} initialNowMinutes={8 * 60} />);

    await user.keyboard("j");
    await user.keyboard(" ");

    expect(actions.updateTaskAction).toHaveBeenCalledWith({
      id: prTask.id,
      changes: { status: "completed" },
    });
  });
});
