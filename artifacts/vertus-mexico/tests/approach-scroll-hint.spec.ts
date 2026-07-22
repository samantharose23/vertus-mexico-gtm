import { test, expect } from "@playwright/test";

/**
 * Guards the scroll cue in the pinned "Our Approach" section
 * ("Sigue deslizando para ver cada paso" / "Keep scrolling to reveal each
 * step"). The hint element ([data-sq-hint]) must be fully visible at the
 * start of the sequence (scroll progress 0) and fully faded out by ~20%
 * progress, in both languages. applyHint() in src/lib/animations.ts maps
 * progress p to opacity clamp(1 - (p - 0.02) / 0.08), so it hits 0 at
 * p = 0.10 — well before the 20% checkpoint asserted here.
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
    // Let the deferred ScrollTrigger.refresh() (300ms after init) settle.
    await page.waitForTimeout(600);

    // Animated mode must be active (grid fallback has no scroll cue and
    // would make this spec vacuous).
    const cards = page.locator("[data-sq-card]");
    expect(
      await cards.count(),
      "Animated approach mode should be active",
    ).toBeGreaterThan(1);

    const hint = page.locator("[data-sq-hint]");
    expect(await hint.count(), "scroll hint element should exist").toBe(1);

    // Resolve the scroll track: card -> field -> sticky stage -> track
    // (same structure the approach-readability spec relies on).
    const track = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>("[data-sq-card]");
      const trackEl =
        card?.parentElement?.parentElement?.parentElement || null;
      if (!trackEl) return null;
      const r = trackEl.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });
    expect(track, "approach scroll track should exist").not.toBeNull();
    if (!track) return;

    // ScrollTrigger runs start "top top" -> end "bottom bottom", so
    // progress = (scrollY - trackTop) / (trackHeight - viewportHeight).
    const scrollRange = track.height - VIEWPORT.height;
    expect(
      scrollRange,
      "track must be taller than the viewport for a pinned sequence",
    ).toBeGreaterThan(0);

    const readOpacity = () =>
      page.evaluate(() => {
        const el = document.querySelector<HTMLElement>("[data-sq-hint]");
        return el ? Number(getComputedStyle(el).opacity) : null;
      });

    const opacityAt = async (progress: number) => {
      const y = track.top + progress * scrollRange;
      await page.evaluate((v) => window.scrollTo(0, v), y);
      // The hint has a .35s CSS opacity transition, and the section's
      // lock-step scrolling can keep adjusting scrollY briefly after a
      // programmatic scroll. Poll until the computed opacity stops moving
      // instead of relying on a single fixed wait.
      await page.waitForTimeout(400);
      let prev = await readOpacity();
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(250);
        const cur = await readOpacity();
        if (
          prev !== null &&
          cur !== null &&
          Math.abs(cur - prev) < 0.001
        ) {
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
