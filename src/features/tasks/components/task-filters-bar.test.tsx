// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_TASK_FILTERS } from "../schemas/task-filters";
import { TaskFiltersBar } from "./task-filters-bar";

describe("TaskFiltersBar", () => {
  it("debounces search into a single filter change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TaskFiltersBar filters={DEFAULT_TASK_FILTERS} autoFocusSearch={false} onChange={onChange} />);

    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "gym");

    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ q: "gym" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("switches between active, completed and all tasks", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TaskFiltersBar filters={DEFAULT_TASK_FILTERS} autoFocusSearch={false} onChange={onChange} />);

    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Completed" }));
    expect(onChange).toHaveBeenCalledWith({ view: "completed" });
  });
});
