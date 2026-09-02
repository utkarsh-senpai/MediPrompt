import { test, expect } from "@playwright/test";

// Verifies the v0.2 exit gate: the mode/subject -> spin -> timed-speech flow works,
// and after a successful first load it keeps working with the network disabled
// (offline shell + precached pack served by the service worker).
test("core loop works online and after an offline reload", async ({ page, context }) => {
  await page.goto("./");
  await page.getByLabel("Subject").selectOption("neuro-physiotherapy");
  await expect(page.getByRole("button", { name: "Spin for a topic" })).toBeEnabled();
  await expect(page.getByText("Curriculum beta · unreviewed draft")).toBeVisible();
  await expect(page.getByLabel("Subject").locator("option")).toHaveText([
    "📖 Research Methods and Bioethics — coming soon",
    "🧬 Applied Physiotherapeutics — coming soon",
    "🧬 Musculoskeletal Physiotherapy — coming soon",
    "🧠 Neuro Physiotherapy",
    "❤️ Cardiovascular & Respiratory Physiotherapy",
    "🧬 Community Health Physiotherapy — coming soon",
    "🧬 Sports Physiotherapy",
  ]);
  const subjectAvailability = await page
    .getByLabel("Subject")
    .locator("option")
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).disabled));
  expect(subjectAvailability).toEqual([false, false, false, true, true, false, true]);
  await expect(page.getByText("Everyday Explanations")).toHaveCount(0);

  // Online core loop: spin -> topic -> start timer -> finish.
  await page.getByRole("button", { name: "Spin for a topic" }).click();
  await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();
  await page.getByRole("button", { name: "Start timer" }).click();
  await expect(page.getByRole("button", { name: "Finish now" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Practice mode" })).toHaveCount(0);
  await page.getByRole("button", { name: "Finish now" }).click();
  await expect(page.getByRole("heading", { name: "Attempt complete" })).toBeVisible();

  await page.evaluate(async () => navigator.serviceWorker.ready.then(() => undefined));

  // CSP blocks unapproved outbound connections.
  const crossOriginBlocked = await page.evaluate(async () => {
    try {
      await fetch("https://example.com/mediprompt-csp-probe");
      return false;
    } catch {
      return true;
    }
  });
  expect(crossOriginBlocked).toBe(true);

  // An unknown same-origin request can hit the network but must never enter an app cache.
  await page.evaluate(async () => {
    try {
      await fetch(new URL("untracked.txt", window.location.href));
    } catch {
      // A 404/network rejection is acceptable; only cache behavior matters.
    }
  });
  const cacheSnapshot = await page.evaluate(async () => {
    const keys = await caches.keys();
    const urls = (
      await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()))
    ).flatMap((requests) => requests.map((request) => request.url));
    return { keys, urls };
  });
  expect(cacheSnapshot.keys.length).toBeGreaterThan(0);
  expect(cacheSnapshot.keys.every((key) => key.startsWith("mediprompt-"))).toBe(true);
  expect(cacheSnapshot.urls.some((url) => url.endsWith("untracked.txt"))).toBe(false);

  // Offline reload: shell + approved pack are cached; setup surface still works.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "Spin for a topic" })).toBeEnabled();
  await expect(page.getByText(/same bundled curriculum-beta snapshot/i)).toHaveCount(0);
  await context.setOffline(false);
});

test("phone-width first-time flow remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Spin for a topic" })).toBeEnabled();
  await page.getByRole("button", { name: "Spin for a topic" }).click();
  await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();
  const hasNoHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(hasNoHorizontalOverflow).toBe(true);
});

test("native subject options keep readable contrast", async ({ page }) => {
  await page.goto("./");
  const palette = await page.getByLabel("Subject").locator("option").first().evaluate(
    (option) => {
      const style = getComputedStyle(option);
      return { color: style.color, backgroundColor: style.backgroundColor };
    },
  );
  expect(palette).toEqual({
    color: "rgb(20, 32, 29)",
    backgroundColor: "rgb(247, 240, 228)",
  });
});

test("reduced-motion mode disables ambient and draw animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Spin for a topic" })).toBeEnabled();

  const ambientAnimations = await page.evaluate(() => {
    const atmosphere = document.querySelector(".atmosphere");
    if (!atmosphere) return null;
    return {
      glow: getComputedStyle(atmosphere, "::before").animationName,
      particles: getComputedStyle(atmosphere, "::after").animationName,
    };
  });
  expect(ambientAnimations).toEqual({ glow: "none", particles: "none" });

  await page.getByRole("button", { name: "Spin for a topic" }).click();
  const drawAnimation = await page
    .locator(".spin-mark")
    .evaluate((element) => getComputedStyle(element).animationName);
  expect(drawAnimation).toBe("none");
  await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();
});

test("Defend depth and Deep Research handoff remain distinct", async ({ page }) => {
  await page.goto("./");

  await page.getByLabel("Subject").selectOption("cardiovascular-and-respiratory-physiotherapy");
  const challenge = page.getByRole("group", { name: "Challenge" });
  await expect(challenge).toBeVisible();
  await expect(challenge.getByRole("button")).toHaveCount(3);
  await challenge.getByRole("button", { name: "Defend" }).click();
  await page.getByRole("button", { name: "Spin for a topic" }).click();
  const topicInfo = page.getByRole("button", { name: "More about this topic" });
  const topicInfoId = await topicInfo.getAttribute("aria-describedby");
  expect(topicInfoId).toBeTruthy();
  await topicInfo.click();
  await expect(page.locator(`[id="${topicInfoId}"]`)).toContainText("Fictional scenario:");
  await expect(page.getByRole("list", { name: "Speaking path" })).toContainText("Now what?");

  await page.reload();
  await page.getByRole("button", { name: "Deep Research" }).click();
  await page.getByLabel("Subject").selectOption("cardiovascular-and-respiratory-physiotherapy");
  await expect(page.getByRole("group", { name: "Challenge" })).toHaveCount(0);
  await page.getByRole("button", { name: "Spin for a topic" }).click();
  await page.getByRole("button", { name: "Begin research" }).click();
  await expect(page.getByText("Research time left")).toBeVisible();
  await page.getByRole("button", { name: "Done researching" }).click();
  await expect(page.getByRole("button", { name: "Start speaking" })).toBeVisible();
  await page.getByRole("button", { name: "Start speaking" }).click();
  await expect(page.getByText("Speaking time left")).toBeVisible();
  await expect(page.getByRole("group", { name: "Practice mode" })).toHaveCount(0);
});

test("v0.5 scores and compares a real physiotherapy retry while offline", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.getByLabel("Subject").selectOption("cardiovascular-and-respiratory-physiotherapy");
  await page.getByRole("group", { name: "Challenge" }).getByRole("button", { name: "Defend" }).click();
  await page.getByRole("button", { name: "Spin for a topic" }).click();
  // The merged subject has 26 topics; only cardiac-rehabilitation carries a viva
  // ladder. Re-spin until "Begin viva" appears (i.e., the draw landed on it).
  while (
    await page.getByRole("button", { name: "Begin viva" }).count() === 0 &&
    (await page.getByRole("button", { name: "Spin again" }).count() > 0)
  ) {
    await page.getByRole("button", { name: "Spin again" }).first().click();
  }
  await expect(
    page.getByRole("heading", { name: "Comprehensive cardiovascular rehabilitation" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Start timer" }).click();
  await page.getByRole("button", { name: "Finish now" }).click();
  await page.getByRole("button", { name: "Review this attempt" }).click();
  await expect(page.getByRole("heading", { name: "Review your attempt" })).toBeVisible();

  await page.evaluate(async () => navigator.serviceWorker.ready.then(() => undefined));
  await context.setOffline(true);
  await page.getByLabel(/Type what you said/i).fill(
    "Start with safety assessment and secondary prevention. Exercise should use risk stratification and supervision.",
  );
  await page.getByRole("button", { name: "Save review" }).click();

  await expect(page.getByRole("heading", { name: "Content coverage" })).toBeVisible();
  await expect(page.getByText(/You touched 2 of 3 listed concepts \(67% by weight\)/)).toBeVisible();
  await expect(page.getByText(/On your next attempt, explain:/)).toContainText(
    "shared decision making",
  );
  await page.getByText("Concepts you touched (2)").click();
  await expect(page.getByText(/Matched rubric wording: “safety assessment”/)).toBeVisible();

  // v0.5: the retry stays on the exact topic and computes a valid offline delta.
  await page.getByRole("button", { name: "Try again on this topic" }).click();
  await expect(
    page.getByRole("heading", { name: "Comprehensive cardiovascular rehabilitation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start timer" }).click();
  await page.getByRole("button", { name: "Finish now" }).click();
  await page.getByRole("button", { name: "Review this attempt" }).click();
  await page.getByLabel(/Type what you said/i).fill(
    "Start with safety assessment and secondary prevention. Exercise should use risk stratification and supervision. Use shared decision making and escalation for recurrent symptoms.",
  );
  await page.getByRole("button", { name: "Save review" }).click();

  await expect(page.getByRole("heading", { name: "Refinement Delta" })).toBeVisible();
  await expect(page.getByText("+33%", { exact: true })).toBeVisible();
  await expect(page.getByText(/Newly covered: Use shared decision making/)).toBeVisible();
  await page.getByText("Attempts (2)").click();
  await expect(page.getByText("Attempt 1 — 67% coverage")).toBeVisible();
  await expect(page.getByText("Attempt 2 — 100% coverage")).toBeVisible();
  await context.setOffline(false);
});

test("v0.6 viva defense ladder scores three answers and returns to review", async ({ page }) => {
  await page.goto("./");
  await page.getByLabel("Subject").selectOption("cardiovascular-and-respiratory-physiotherapy");
  await page.getByRole("group", { name: "Challenge" }).getByRole("button", { name: "Defend" }).click();
  await page.getByRole("button", { name: "Spin for a topic" }).click();
  await expect(
    page.getByRole("heading", { name: "Comprehensive cardiovascular rehabilitation" }),
  ).toBeVisible();

  // Reach the main attempt review via the typed path.
  await page.getByRole("button", { name: "Start timer" }).click();
  await page.getByRole("button", { name: "Finish now" }).click();
  await page.getByRole("button", { name: "Review this attempt" }).click();
  await page.getByLabel(/Type what you said/i).fill("Safety assessment and secondary prevention.");
  await page.getByRole("button", { name: "Save review" }).click();
  // The main attempt review appears before the viva entry is opened.
  await expect(page.getByRole("heading", { name: "Attempt review" })).toBeVisible();

  // Open the viva ladder.
  await page.getByRole("button", { name: "Begin viva" }).first().click();
  await expect(page.getByRole("heading", { name: /Viva:/ })).toBeVisible();
  await page.getByRole("button", { name: "Begin viva" }).click();

  const answers = [
    "Safety assessment with secondary prevention and patient goals.",
    "Individualized exercise with supervision and risk stratification.",
    "Shared decision making with escalation for recurrent symptoms.",
  ];
  for (const answer of answers) {
    await expect(page.getByRole("button", { name: "Start speaking" })).toBeVisible();
    await page.getByRole("button", { name: "Start speaking" }).click();
    await page.getByRole("button", { name: "Finish now" }).click();
    await page.getByRole("button", { name: "Review this answer" }).click();
    await page.getByLabel(/Type what you said/i).fill(answer);
    await page.getByRole("button", { name: "Save review" }).click();
    await expect(page.getByRole("heading", { name: "Content coverage" })).toBeVisible();
    if (answer === answers[answers.length - 1]) {
      await page.getByRole("button", { name: "Finish viva" }).click();
    } else {
      await page.getByRole("button", { name: "Next question" }).click();
    }
  }

  await expect(page.getByRole("heading", { name: /Viva complete:/ })).toBeVisible();
  await expect(
    page.getByText(/100% target-concept coverage across 3 scored answers/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to attempt review" }).click();
  await expect(page.getByRole("heading", { name: "Attempt review" })).toBeVisible();
});

test("v0.7 learning plan is opt-in, persists metadata, and verifies deletion", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("Learning plan · paused")).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  const planOptIn = page.getByLabel(/Private learning plan/i);
  await expect(planOptIn).not.toBeChecked();
  await planOptIn.check();
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("button", { name: "Spin for a topic" }).click();
  await page.getByRole("button", { name: "Start timer" }).click();
  await page.getByRole("button", { name: "Finish now" }).click();
  await page.getByRole("button", { name: "Review this attempt" }).click();
  await page.getByLabel(/Type what you said/i).fill("A structured physiotherapy answer.");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.getByText(/Saved to your private learning plan/i)).toBeVisible();

  const storedShape = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("mediprompt-history", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const records = await new Promise<unknown[]>((resolve, reject) => {
      const request = database.transaction("records", "readonly").objectStore("records").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return JSON.stringify(records);
  });
  expect(storedShape).not.toContain("transcript");
  expect(storedShape).not.toContain("conceptResults");

  await page.reload();
  await page.getByText(/Learning plan · 0 due/i).click();
  await expect(page.getByText("1 saved attempt; maximum 500.")).toBeVisible();
  await page.getByRole("button", { name: "Delete saved data" }).click();
  await page.getByRole("button", { name: "Delete all plan data" }).click();
  await expect(
    page.getByText("All saved learning-plan data was deleted from this browser."),
  ).toBeVisible();
  await expect(page.getByText("0 saved attempts; maximum 500.")).toBeVisible();
});
