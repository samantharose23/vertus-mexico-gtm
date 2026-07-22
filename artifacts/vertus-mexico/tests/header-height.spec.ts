import { test, expect } from "@playwright/test";

/**
 * Guards the fixed header's rendered height.
 *
 * The logo is 68px tall with 8px vertical header padding. If a future logo or
 * padding tweak silently changes the header height, the fixed bar covers a
 * different amount of the page and pushes the visual layout around.
 *
 * Expected height: 68px logo + 2 × 8px padding + 1px bottom border = 85px.
 * We allow a small tolerance for sub-pixel rendering, but anything beyond a
 * couple of pixels means the logo/padding balance broke.
 */

const LANGS = ["es", "en"] as const;

const EXPECTED_HEIGHT = 85; // 68 logo + 16 padding + 1 border
const EXPECTED_LOGO = 68;
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
      Math.abs((m.logoHeight as number) - EXPECTED_LOGO),
      `header logo height drifted from ${EXPECTED_LOGO}px (${lang}): got ${m.logoHeight}px`,
    ).toBeLessThanOrEqual(1);

    expect(
      Math.abs(m.height - EXPECTED_HEIGHT),
      `Fixed header height drifted (${lang}): got ${m.height.toFixed(1)}px, expected ~${EXPECTED_HEIGHT}px (${EXPECTED_LOGO}px logo + 2×8px padding + 1px border). A logo or padding change is changing the header height and will shift the menu/page content.`,
    ).toBeLessThanOrEqual(TOLERANCE);
  });
}
