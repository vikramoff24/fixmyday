import { expect, test } from "@playwright/test";

test("mobile: bottom navigation and the planner sheet", async ({ page }) => {
  await page.goto("/today");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Tasks" })).toBeVisible();

  await page.getByRole("button", { name: "Plan with AI" }).click();
  const sheet = page.getByRole("dialog", { name: "Plan with AI" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel("What's on your mind?")).toBeFocused();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
