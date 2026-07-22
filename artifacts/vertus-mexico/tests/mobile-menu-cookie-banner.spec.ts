import { test, expect, type Page } from "@playwright/test";

/**
 * Guards the mobile navigation (hamburger menu, shown ≤860px) and the
 * stacked cookie-banner layout (≤560px) against silent regressions.
 *
 * Mobile (390px viewport):
 *   - hamburger button visible, desktop nav absent
 *   - tapping it opens the overlay with 5 links + ES/EN language toggle
 *   - tapping a link closes the menu and scrolls to the target section
 *   - Escape closes the menu
 *   - cookie banner buttons are stacked full-width with no mid-label wrapping
 *
 * Desktop (1024px viewport):
 *   - nav renders as a single row of 5 links, no hamburger
 */

const CONSENT_STORAGE_KEY = "vertus_consent";
const NAV_LINK_COUNT = 4;

/** Pre-seed consent so the cookie banner never overlays the menu tests. */
async function dismissConsent(page: Page) {
  await page.addInitScript(
    ([key]) => {
      localStorage.setItem(
        key,
        JSON.stringify({ analytics: "denied", ads: "denied", ts: Date.now() }),
      );
    },
    [CONSENT_STORAGE_KEY],
  );
}

test.describe("mobile navigation @ 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger visible, desktop nav absent", async ({ page }) => {
    await dismissConsent(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hamburger = page.getByTestId("button-mobile-menu");
    await expect(hamburger).toBeVisible();

    // Desktop nav (a <nav> directly inside the header) must not render.
    await expect(page.locator("header nav")).toHaveCount(0);
    await expect(page.locator("header .vx-navlink")).toHaveCount(0);

    // Menu overlay starts closed.
    await expect(page.getByTestId("panel-mobile-menu")).toHaveCount(0);
    await expect(hamburger).toHaveAttribute("aria-expanded", "false");
  });

  test("ES/EN toggle sits in the header; overlay has 4 links", async ({
    page,
  }) => {
    await dismissConsent(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const header = page.locator("header");

    // The language toggle lives in the header (outside the hamburger menu) and
    // is visible on mobile without opening the menu.
    await expect(header.getByRole("button", { name: "Español" })).toBeVisible();
    await expect(header.getByRole("button", { name: "English" })).toBeVisible();

    await page.getByTestId("button-mobile-menu").click();

    const panel = page.getByTestId("panel-mobile-menu");
    await expect(panel).toBeVisible();
    await expect(
      page.getByTestId("button-mobile-menu"),
    ).toHaveAttribute("aria-expanded", "true");

    // Exactly 4 section links inside the overlay.
    const links = panel.locator("nav a.vx-navlink");
    await expect(links).toHaveCount(NAV_LINK_COUNT);
    for (let i = 0; i < NAV_LINK_COUNT; i++) {
      await expect(links.nth(i)).toBeVisible();
      const href = await links.nth(i).getAttribute("href");
      expect(href, `nav link ${i} should be a section anchor`).toMatch(/^#\w+/);
    }

    // The toggle is no longer inside the overlay.
    await expect(panel.getByRole("button", { name: "Español" })).toHaveCount(0);
  });

  test("clicking a link closes the menu and scrolls to the section", async ({
    page,
  }) => {
    await dismissConsent(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("button-mobile-menu").click();
    const panel = page.getByTestId("panel-mobile-menu");
    await expect(panel).toBeVisible();

    // Click the "Team" (#equipo) link — a mid-page section.
    const link = panel.locator('nav a.vx-navlink[href="#equipo"]');
    await expect(link).toBeVisible();
    await link.click();

    // Menu closes…
    await expect(panel).toHaveCount(0);
    await expect(
      page.getByTestId("button-mobile-menu"),
    ).toHaveAttribute("aria-expanded", "false");

    // …and the page scrolls so the section is at/near the top of the viewport.
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const el = document.getElementById("equipo");
            if (!el) return Number.POSITIVE_INFINITY;
            return el.getBoundingClientRect().top;
          }),
        { message: "#equipo section should scroll into view", timeout: 5_000 },
      )
      .toBeLessThan(400);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY, "page should have scrolled down").toBeGreaterThan(0);
  });

  test("Escape closes the menu", async ({ page }) => {
    await dismissConsent(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("button-mobile-menu").click();
    await expect(page.getByTestId("panel-mobile-menu")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByTestId("panel-mobile-menu")).toHaveCount(0);
    await expect(
      page.getByTestId("button-mobile-menu"),
    ).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("cookie banner layout @ 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const lang of ["es", "en"] as const) {
    test(`buttons stack full-width without mid-label wrapping (${lang})`, async ({
      page,
    }) => {
      // Fresh visit (no stored consent) so the banner appears.
      await page.goto(`/?lang=${lang}`);
      await page.waitForLoadState("networkidle");

      const banner = page.getByTestId("banner-cookie-consent");
      await expect(banner).toBeVisible();

      const result = await page.evaluate(() => {
        const TOL = 1;
        const actions = document.querySelector<HTMLElement>(
          "#cookie-consent-banner .cc-actions",
        );
        if (!actions) return { error: ".cc-actions not found" };
        const buttons = Array.from(
          actions.querySelectorAll<HTMLElement>("button"),
        );
        const actionsRect = actions.getBoundingClientRect();
        const problems: string[] = [];

        let prevBottom = -Infinity;
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          const label = (btn.textContent || "").trim();

          // Full width of the actions container.
          if (Math.abs(rect.width - actionsRect.width) > TOL) {
            problems.push(
              `"${label}" width ${rect.width.toFixed(1)}px != container ${actionsRect.width.toFixed(1)}px (not full-width)`,
            );
          }

          // Stacked vertically: each button starts below the previous one.
          if (rect.top < prevBottom - TOL) {
            problems.push(
              `"${label}" overlaps the previous button (top ${rect.top.toFixed(1)} < prev bottom ${prevBottom.toFixed(1)})`,
            );
          }
          prevBottom = rect.bottom;

          // No mid-label wrapping: the rendered text must occupy one line.
          const range = document.createRange();
          range.selectNodeContents(btn);
          const lineTops = new Set<number>();
          for (const r of Array.from(range.getClientRects())) {
            if (r.width === 0 || r.height === 0) continue;
            let matched = false;
            for (const t of lineTops) {
              if (Math.abs(t - r.top) < 4) {
                matched = true;
                break;
              }
            }
            if (!matched) lineTops.add(r.top);
          }
          if (lineTops.size > 1) {
            problems.push(
              `"${label}" wraps onto ${lineTops.size} lines mid-label`,
            );
          }

          // Label must not clip either.
          if (btn.scrollWidth > btn.clientWidth + TOL) {
            problems.push(
              `"${label}" clips (scrollWidth ${btn.scrollWidth} > clientWidth ${btn.clientWidth})`,
            );
          }
        }

        return { buttonCount: buttons.length, problems };
      });

      expect(result.error, result.error ?? "").toBeUndefined();
      expect(
        result.buttonCount,
        "cookie banner should show 3 action buttons",
      ).toBe(3);
      expect(
        result.problems?.length ?? 0,
        `Cookie banner layout problems (${lang}):\n  • ${(result.problems ?? []).join("\n  • ")}`,
      ).toBe(0);
    });
  }
});

test.describe("desktop navigation @ 1024px", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("nav renders one row of links, no hamburger", async ({ page }) => {
    await dismissConsent(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // No hamburger, no overlay.
    await expect(page.getByTestId("button-mobile-menu")).toHaveCount(0);
    await expect(page.getByTestId("panel-mobile-menu")).toHaveCount(0);

    // 4 section links + the plain-text Contact link.
    const DESKTOP_NAV_LINK_COUNT = NAV_LINK_COUNT + 1;
    const links = page.locator("header nav a.vx-navlink");
    await expect(links).toHaveCount(DESKTOP_NAV_LINK_COUNT);

    // All links share the same row (equal tops within tolerance).
    const tops: number[] = [];
    for (let i = 0; i < DESKTOP_NAV_LINK_COUNT; i++) {
      await expect(links.nth(i)).toBeVisible();
      const box = await links.nth(i).boundingBox();
      expect(box, `nav link ${i} should have a bounding box`).not.toBeNull();
      tops.push(box!.y);
    }
    const minTop = Math.min(...tops);
    const maxTop = Math.max(...tops);
    expect(
      maxTop - minTop,
      `desktop nav links should sit on one row (tops: ${tops.map((t) => t.toFixed(1)).join(", ")})`,
    ).toBeLessThanOrEqual(2);

    // Language toggle also present in the header row.
    const header = page.locator("header");
    await expect(header.getByRole("button", { name: "Español" })).toBeVisible();
    await expect(header.getByRole("button", { name: "English" })).toBeVisible();
  });
});
