// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";
import type { PlanDraft } from "../types";
import { PlannerPanel } from "./planner-panel";

const actions = vi.hoisted(() => ({
  createPlanDraftAction: vi.fn(),
  reorganizePlanDraftAction: vi.fn(),
  acceptPlanDraftAction: vi.fn(),
}));
vi.mock("../actions", () => actions);

const draft: PlanDraft = {
  input: "finish PR and gym",
  summary: "I've organized 2 things for you.",
  source: "ai",
  assumptions: ["Estimated how long things take where you didn't say."],
  warnings: [],
  tasks: [
    {
      key: "t1",
      title: "Finish PR",
      category: "work",
      priority: "high",
      estimatedMinutes: 90,
      date: "2026-10-05",
      startMinutes: 540,
      isPinned: false,
      timeOfDay: "morning",
      dependsOn: [],
      notes: null,
    },
    {
      key: "t2",
      title: "Gym",
      category: "health",
      priority: "medium",
      estimatedMinutes: 60,
      date: "2026-10-05",
      startMinutes: 1080,
      isPinned: false,
      timeOfDay: "evening",
      dependsOn: [],
      notes: null,
    },
  ],
};

describe("PlannerPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("turns thoughts into a draft and saves it only when accepted", async () => {
    const user = userEvent.setup();
    actions.createPlanDraftAction.mockResolvedValue({ ok: true, data: draft });
    actions.acceptPlanDraftAction.mockResolvedValue({ ok: true, data: [{}, {}] });
    const onAccepted = vi.fn();
    renderWithProviders(<PlannerPanel onAccepted={onAccepted} />);

    await user.type(screen.getByLabelText("What's on your mind?"), "finish PR and gym{Enter}");

    expect(actions.createPlanDraftAction).toHaveBeenCalledWith("finish PR and gym");
    expect(await screen.findByText("I've organized 2 things for you.")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("Gym")).toBeInTheDocument();
    expect(actions.acceptPlanDraftAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Accept plan" }));

    await waitFor(() => expect(onAccepted).toHaveBeenCalledWith(2));
    expect(actions.acceptPlanDraftAction).toHaveBeenCalledWith(draft);
    expect(await screen.findByText("Added 2 tasks to your plan")).toBeInTheDocument();
  });

  it("lets the user edit and remove tasks before accepting", async () => {
    const user = userEvent.setup();
    actions.createPlanDraftAction.mockResolvedValue({ ok: true, data: draft });
    actions.acceptPlanDraftAction.mockResolvedValue({ ok: true, data: [{}] });
    renderWithProviders(<PlannerPanel />);

    await user.type(screen.getByLabelText("What's on your mind?"), "finish PR and gym{Enter}");
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    const title = screen.getAllByLabelText("Task title")[0];
    await user.clear(title);
    await user.type(title, "Ship PR");
    await user.click(screen.getByRole("button", { name: "Remove Gym from plan" }));
    await user.click(screen.getByRole("button", { name: "Accept plan" }));

    await waitFor(() => expect(actions.acceptPlanDraftAction).toHaveBeenCalled());
    const accepted = actions.acceptPlanDraftAction.mock.calls[0][0] as PlanDraft;
    expect(accepted.tasks.map((task) => task.title)).toEqual(["Ship PR"]);
  });

  it("explains failures and retries with the same thoughts", async () => {
    const user = userEvent.setup();
    actions.createPlanDraftAction
      .mockResolvedValueOnce({
        ok: false,
        error: "The AI is busy right now. Please try again in a minute.",
        code: "RATE_LIMITED",
      })
      .mockResolvedValueOnce({ ok: true, data: draft });
    renderWithProviders(<PlannerPanel />);

    await user.type(screen.getByLabelText("What's on your mind?"), "finish PR and gym{Enter}");

    expect(await screen.findByText("We couldn't organize your plan.")).toBeInTheDocument();
    expect(screen.getByText("The AI is busy right now. Please try again in a minute.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("I've organized 2 things for you.")).toBeInTheDocument();
    expect(actions.createPlanDraftAction).toHaveBeenLastCalledWith("finish PR and gym");
  });
});
