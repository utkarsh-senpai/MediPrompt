import { test, expect } from "@playwright/test";

// Verifies the v0.2 exit gate: the mode/subject -> spin -> timed-speech flow works,
// and after a successful first load it keeps working with the network disabled
// (offline shell + precached pack served by the service worker).
test("core loop works online and after an offline reload", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Spin for a topic" })).toBeEnabled();

  // Online core loop: spin -> topic -> start timer -> finish.
  await page.getByRole("button", { name: "Spin for a topic" }).click();
  await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();
  await page.getByRole("button", { name: "Start timer" }).click();
  await expect(page.getByRole("button", { name: "Finish now" })).toBeVisible();
  await page.getByRole("button", { name: "Finish now" }).click();
  await expect(page.getByRole("heading", { name: "Attempt complete" })).toBeVisible();

  // Offline reload: shell + pack are cached; setup surface still works.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "Spin for a topic" })).toBeEnabled();
  await context.setOffline(false);
});
