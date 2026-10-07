// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";
import { NewTaskDialog } from "./new-task-dialog";

const actions = vi.hoisted(() => ({ createTaskAction: vi.fn() }));
vi.mock("../actions", () => actions);

describe("NewTaskDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates the title before saving", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewTaskDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Give your task a title.")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
    expect(actions.createTaskAction).not.toHaveBeenCalled();
  });

  it("creates a task for today with the chosen time", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    actions.createTaskAction.mockResolvedValue({ ok: true, data: {} });
    renderWithProviders(<NewTaskDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Title"), "Book dentist");
    await user.type(screen.getByLabelText("Time"), "14:30");
    await user.type(screen.getByLabelText("Notes"), "Ask about cleaning");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() =>
      expect(actions.createTaskAction).toHaveBeenCalledWith({
        title: "Book dentist",
        description: "Ask about cleaning",
        category: "other",
        priority: "medium",
        dueDate: "2026-10-05",
        startTime: "14:30",
        estimatedMinutes: 30,
      }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("schedules the task on the date picked from the calendar", async () => {
    const user = userEvent.setup();
    actions.createTaskAction.mockResolvedValue({ ok: true, data: {} });
    renderWithProviders(<NewTaskDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Pay rent");
    await user.click(screen.getByLabelText("Date"));
    await user.click(screen.getByRole("button", { name: "Tomorrow" }));
    expect(screen.getByLabelText("Date")).toHaveTextContent("Tomorrow · Tue, Oct 6");

    await user.click(screen.getByRole("button", { name: "Create task" }));
    await waitFor(() =>
      expect(actions.createTaskAction).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: "2026-10-06" }),
      ),
    );
  });

  it("keeps the dialog open and shows the error when saving fails", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    actions.createTaskAction.mockResolvedValue({
      ok: false,
      error: "Your session has expired. Please sign in again.",
      code: "UNAUTHENTICATED",
    });
    renderWithProviders(<NewTaskDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Title"), "Book dentist");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Your session has expired. Please sign in again.")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
