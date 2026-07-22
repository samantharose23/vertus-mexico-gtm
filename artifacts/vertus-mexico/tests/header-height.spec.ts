import { test, expect } from "@playwright/test";

/**
 * Guards the fixed header's rendered height.
 *
 * The logo was enlarged (40px -> 52px) and the header's vertical padding was
 * reduced (14px -> 8px) so the header keeps its original overall height. If a
 * future logo or padding tweak silently grows the header, the fixed bar
 * covers more of the page and pushes the visual layout around.
 *
 * Expected height: 52px logo + 2 × 8px padding + 1px bottom border = 69px.
 * We allow a small tolerance for sub-pixel rendering, but anything beyond a
 * couple of pixels means the logo/padding balance broke.
 */

const LANGS = ["es", "en"] as const;

const EXPECTED_HEIGHT = 69; // 52 logo + 16 padding + 1 border
const TOLERANCE = 2;

for (const lang of LANGS) {
  test(`fixed header stays ~${EXPECTED_HEIGHT}px tall (${lang})`, async ({
    page,
  }) => {
    await page.goto(`/?lang=${lang}`);
    await page.waitForLoadState("networkidle");

    const header = page.locator("header");
    await expect(header).toBeVisible();

    const m = await header.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const styles = getComputedStyle(el);
      const logo = el.querySelector<HTMLElement>("img");
      return {
        height: rect.height,
        top: rect.top,
        position: styles.position,
        logoHeight: logo ? logo.getBoundingClientRect().height : null,
      };
    });

    // The header must still be the fixed bar pinned to the top — if it ever
    // stops being fixed, its height no longer constrains the layout the same
    // way and this guard would be measuring the wrong thing.
    expect(m.position, `header is no longer position: fixed (${lang})`).toBe(
      "fixed",
    );
    expect(
      Math.abs(m.top),
      `header is no longer pinned to the top of the viewport (${lang})`,
    ).toBeLessThanOrEqual(1);

    expect(
      m.logoHeight,
      `header logo not found (${lang})`,
    ).not.toBeNull();
    expect(
      Math.abs((m.logoHeight as number) - 52),
      `header logo height drifted from 52px (${lang}): got ${m.logoHeight}px`,
    ).toBeLessThanOrEqual(1);

    expect(
      Math.abs(m.height - EXPECTED_HEIGHT),
      `Fixed header height drifted (${lang}): got ${m.height.toFixed(1)}px, expected ~${EXPECTED_HEIGHT}px (52px logo + 2×8px padding + 1px border). A bigger logo or padding change is growing the header and will shift the menu/page content.`,
    ).toBeLessThanOrEqual(TOLERANCE);
  });
}
