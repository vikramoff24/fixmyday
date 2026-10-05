import { expect, test } from "@playwright/test";

import { expectNoSeriousA11yViolations, uniqueToken } from "./helpers";

test("landing page introduces the product", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your thoughts are messy.");
  await expect(page.getByRole("link", { name: "Start planning" })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("thoughts → plan → action: plan, accept, complete, delete and undo", async ({ page }) => {
  const token = uniqueToken();
  const title = `Water the plants ${token}`;

  await page.goto("/today");
  await page.getByLabel("What's on your mind?").fill(`today at 11pm water the plants ${token}`);
  await page.keyboard.press("Enter");

  const plan = page.getByRole("region", { name: "Proposed plan" });
  await expect(plan.getByText("I've organized 1 thing for you.")).toBeVisible();
  await expect(plan.getByText("23:00", { exact: true })).toBeVisible();
  await plan.getByRole("button", { name: "Accept plan" }).click();
  await expect(page.getByText("Added 1 task to your plan")).toBeVisible();

  // The accepted task is in today's timeline and survives a reload.
  const checkbox = page.getByRole("checkbox", { name: `Mark “${title}” as done` });
  await expect(checkbox).toBeVisible();
  await checkbox.click();
  await expect(page.getByRole("checkbox", { name: `Mark “${title}” as not done` })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("checkbox", { name: `Mark “${title}” as not done` })).toBeVisible();

  // Delete from the detail panel, then undo.
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Task deleted")).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(title) })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Task restored")).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(title) })).toBeVisible();
});

test("tasks can be created manually and found by search", async ({ page }) => {
  const token = uniqueToken();
  await page.goto("/tasks");
  await page.keyboard.press("n");
  await page.getByLabel("Title").fill(`Renew passport ${token}`);
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Task created")).toBeVisible();

  await page.keyboard.press("/");
  await page.keyboard.type(token);
  await expect(page).toHaveURL(new RegExp(`q=${token}`));
  await expect(page.getByRole("button", { name: new RegExp(`Renew passport ${token}`) })).toBeVisible();
  await expect(page.getByText("1 task", { exact: true })).toBeVisible();
});

test("command palette navigates between pages", async ({ page }) => {
  await page.goto("/today");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByPlaceholder("Type a command or search…").fill("insights");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/insights$/);
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();
});

for (const path of ["/today", "/tasks", "/calendar", "/insights", "/ask", "/settings"]) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page);
  });
}
