import { test, expect } from "@playwright/test";

/**
 * Guards the scroll cue in the pinned "Our Approach" section
 * ("Sigue deslizando para ver cada paso" / "Keep scrolling to reveal each
 * step"). The hint element ([data-ap-hint]) must be fully visible at the
 * start of the sequence (scroll progress 0) and faded out once the visitor
 * advances, in both languages. The stepper driver in src/lib/animations.ts
 * sets hint opacity to 1 while progress < 0.02 and 0 afterwards, so it is
 * gone well before the 20% checkpoint asserted here.
 */

const LANGS = ["es", "en"] as const;
const VIEWPORT = { width: 1280, height: 900 };

for (const lang of LANGS) {
  test(`scroll hint visible at start, gone by 20% progress (${lang})`, async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "desktop",
      "animated approach mode is desktop-only; viewport is pinned",
    );
    await page.setViewportSize(VIEWPORT);
    await page.goto(`/?lang=${lang}`);
    await page.waitForLoadState("networkidle");
    // Let the stepper's initial render() settle after mount.
    await page.waitForTimeout(600);

    // Animated mode must be active (grid fallback has no scroll cue and
    // would make this spec vacuous).
    const driver = page.locator("[data-ap-driver]");
    expect(
      await driver.count(),
      "Animated approach mode should be active",
    ).toBe(1);

    const hint = page.locator("[data-ap-hint]");
    expect(await hint.count(), "scroll hint element should exist").toBe(1);

    const track = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("[data-ap-driver]");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });
    expect(track, "approach scroll track should exist").not.toBeNull();
    if (!track) return;

    // The sticky stage is 100vh, so scrollable travel = driver height - vh.
    const scrollRange = track.height - VIEWPORT.height;
    expect(
      scrollRange,
      "track must be taller than the viewport for a pinned sequence",
    ).toBeGreaterThan(0);

    const readOpacity = () =>
      page.evaluate(() => {
        const el = document.querySelector<HTMLElement>("[data-ap-hint]");
        return el ? Number(getComputedStyle(el).opacity) : null;
      });

    const opacityAt = async (progress: number) => {
      const y = track.top + progress * scrollRange;
      await page.evaluate((v) => window.scrollTo(0, v), y);
      // The hint has a .5s CSS opacity transition; poll until it settles
      // instead of relying on a single fixed wait.
      await page.waitForTimeout(400);
      let prev = await readOpacity();
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(250);
        const cur = await readOpacity();
        if (prev !== null && cur !== null && Math.abs(cur - prev) < 0.001) {
          return cur;
        }
        prev = cur;
      }
      return prev;
    };

    const atStart = await opacityAt(0);
    expect(atStart, "hint opacity at progress 0").not.toBeNull();
    expect(
      atStart!,
      `hint should be fully visible at the start of the sequence (${lang})`,
    ).toBeGreaterThanOrEqual(0.99);

    const atTwenty = await opacityAt(0.2);
    expect(atTwenty, "hint opacity at 20% progress").not.toBeNull();
    expect(
      atTwenty!,
      `hint should be fully faded out by 20% progress (${lang})`,
    ).toBeLessThanOrEqual(0.01);

    // Scrolling back to the start must bring the cue back (the mapping is
    // progress-driven, not a one-shot fade).
    const backAtStart = await opacityAt(0);
    expect(
      backAtStart!,
      `hint should reappear when scrolled back to the start (${lang})`,
    ).toBeGreaterThanOrEqual(0.99);
  });
}
