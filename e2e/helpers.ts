import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails on serious or critical accessibility violations. */
export async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(
    serious.map(
      (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    ),
  ).toEqual([]);
}

/** A unique word so tests don't collide with existing data. */
export function uniqueToken(): string {
  return `zq${Date.now().toString(36)}`;
}
