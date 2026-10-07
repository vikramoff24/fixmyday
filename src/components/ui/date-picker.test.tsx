// @vitest-environment jsdom
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";
import { DatePicker } from "./date-picker";

// TEST_CLOCK puts "today" on Monday, October 5, 2026.

describe("DatePicker", () => {
  it("labels nearby days relative to today", () => {
    renderWithProviders(<DatePicker aria-label="Due" value="2026-10-06" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Due" })).toHaveTextContent("Tomorrow · Tue, Oct 6");
  });

  it("shows the placeholder when empty", () => {
    renderWithProviders(<DatePicker aria-label="Due" value="" onChange={vi.fn()} placeholder="No date" />);
    expect(screen.getByRole("button", { name: "Due" })).toHaveTextContent("No date");
  });

  it("picks a day from the calendar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DatePicker aria-label="Due" value="2026-10-05" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Due" }));
    expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    // The selected day is focused so the keyboard works straight away.
    expect(screen.getByRole("button", { name: "Monday, October 5, today" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Thursday, October 15" }));
    expect(onChange).toHaveBeenCalledWith("2026-10-15");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("supports quick picks and clearing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DatePicker aria-label="Due" value="2026-10-05" onChange={onChange} clearable />);

    await user.click(screen.getByRole("button", { name: "Due" }));
    await user.click(screen.getByRole("button", { name: "Next week" }));
    expect(onChange).toHaveBeenLastCalledWith("2026-10-12");

    await user.click(screen.getByRole("button", { name: "Due" }));
    await user.click(screen.getByRole("button", { name: "No date" }));
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("navigates with the keyboard across months", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DatePicker aria-label="Due" value="2026-10-05" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Due" }));
    await user.keyboard("{PageDown}");
    // The outgoing month stays mounted while it slides away, so look inside the new one.
    const november = await screen.findByRole("grid", { name: "November 2026" });
    expect(within(november).getByRole("button", { name: "Thursday, November 5" })).toHaveFocus();

    await user.keyboard("{ArrowRight}{Enter}");
    expect(onChange).toHaveBeenCalledWith("2026-11-06");
  });
});
