import { test, expect } from "@playwright/test";

/**
 * Guards readability of the scroll-driven "Nuestro enfoque" stepper on
 * smaller laptop screens.
 *
 * The animated mode pins a sticky stage while the camera zooms through eight
 * Fibonacci squares; the active step's title + description sit in a card in
 * the right-hand column. It was verified at 1440x900 / 1920x1080, but small
 * laptops (~1280x720, ~1024x768) still run the animated mode with tight
 * vertical space. This spec drives the scroll-linked animation to each step's
 * settle position and fails if the active card's title or body text lands
 * outside the viewport (clipped), or if the page develops horizontal scroll.
 *
 * Spanish copy is the longest, but both languages are checked.
 */

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
] as const;
const LANGS = ["es", "en"] as const;

// Require the text to sit at least this far inside the viewport edges so
// "fits" also means "not cramped against the edge".
const MIN_CLEARANCE = 8;
const TOL = 1;

// Mirrors scrollForIndex() in the stepper driver: the scroll fraction that
// settles the camera on step i (last step lands at 0.95).
const PROG_END = 0.9;
function fracForStep(i: number, lastIdx: number): number {
  if (i >= lastIdx) return 0.95;
  return ((i + 0.22) / lastIdx) * PROG_END;
}

type StepIssue = { step: number; part: string; reason: string };

for (const vp of VIEWPORTS) {
  test.describe(`approach animation @ ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const lang of LANGS) {
      test(`active step card stays readable (${lang})`, async ({ page }) => {
        // This spec pins its own laptop viewports, so running it again under
        // the "mobile" project would only duplicate the identical desktop run.
        test.skip(
          test.info().project.name !== "desktop",
          "viewports are pinned; desktop project only",
        );
        await page.goto(`/?lang=${lang}`);
        await page.waitForLoadState("networkidle");
        // The page sets scroll-behavior: smooth; programmatic scrolls must
        // land instantly so the sticky stage is pinned before we measure.
        await page.addStyleTag({
          content: "*{scroll-behavior:auto !important}",
        });
        // Let the stepper's initial render() settle after mount.
        await page.waitForTimeout(600);

        // Animated mode must be active at these widths (grid fallback would
        // make this spec vacuous).
        const driver = page.locator("[data-ap-driver]");
        expect(
          await driver.count(),
          `Animated approach mode should be active at ${vp.width}px`,
        ).toBe(1);

        const info = await page.evaluate(() => {
          const el = document.querySelector<HTMLElement>("[data-ap-driver]");
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const cards = el.querySelectorAll("[data-ap-card]").length;
          return { top: r.top + window.scrollY, height: r.height, cards };
        });
        expect(info, "approach scroll track should exist").not.toBeNull();
        if (!info) return;

        const n = info.cards;
        expect(n, "stepper should have cards").toBeGreaterThan(1);
        const scrollRange = info.height - vp.height;
        expect(
          scrollRange,
          "track must be taller than the viewport",
        ).toBeGreaterThan(0);

        const issues: StepIssue[] = [];
        let sawHScroll = false;

        for (let i = 0; i < n; i++) {
          const targetY = info.top + fracForStep(i, n - 1) * scrollRange;
          await page.evaluate((y) => window.scrollTo(0, y), targetY);

          // The card fades/blurs in over .55s once the camera settles; poll
          // until a card reaches full opacity instead of a single fixed wait.
          await page.waitForTimeout(500);
          let ready = false;
          for (let t = 0; t < 8; t++) {
            const op = await page.evaluate(() => {
              const cards = Array.from(
                document.querySelectorAll<HTMLElement>("[data-ap-card]"),
              );
              return Math.max(
                ...cards.map((c) => Number(getComputedStyle(c).opacity)),
              );
            });
            if (op >= 0.99) {
              ready = true;
              break;
            }
            await page.waitForTimeout(250);
          }
          if (!ready) {
            issues.push({
              step: i,
              part: "card",
              reason: "no card reached full opacity at this step",
            });
            continue;
          }

          const result = await page.evaluate(
            ({ step, minClear, tol }) => {
              const issues: {
                step: number;
                part: string;
                reason: string;
              }[] = [];
              const cards = Array.from(
                document.querySelectorAll<HTMLElement>("[data-ap-card]"),
              );
              // The visible card is the one that has faded in.
              const visible = cards.find(
                (c) => Number(getComputedStyle(c).opacity) >= 0.99,
              );
              if (!visible) {
                issues.push({
                  step,
                  part: "card",
                  reason: "no visible card found",
                });
                return { issues, hScroll: false };
              }
              const vw = document.documentElement.clientWidth;
              const vh = document.documentElement.clientHeight;
              const parts: [string, string][] = [
                ["title", "h2"],
                ["body", "p"],
              ];
              for (const [name, sel] of parts) {
                const el = visible.querySelector<HTMLElement>(sel);
                if (!el || !el.textContent?.trim()) {
                  issues.push({
                    step,
                    part: name,
                    reason: "missing element or empty text",
                  });
                  continue;
                }
                const r = el.getBoundingClientRect();
                if (r.left < minClear - tol) {
                  issues.push({
                    step,
                    part: name,
                    reason: `left ${r.left.toFixed(1)}px clipped past viewport edge`,
                  });
                }
                if (r.right > vw - minClear + tol) {
                  issues.push({
                    step,
                    part: name,
                    reason: `right ${r.right.toFixed(1)}px past viewport width ${vw}px`,
                  });
                }
                if (r.top < minClear - tol) {
                  issues.push({
                    step,
                    part: name,
                    reason: `top ${r.top.toFixed(1)}px clipped above viewport`,
                  });
                }
                if (r.bottom > vh - minClear + tol) {
                  issues.push({
                    step,
                    part: name,
                    reason: `bottom ${r.bottom.toFixed(1)}px below viewport height ${vh}px`,
                  });
                }
              }
              const hScroll =
                document.documentElement.scrollWidth >
                document.documentElement.clientWidth + tol;
              return { issues, hScroll };
            },
            { step: i, minClear: MIN_CLEARANCE, tol: TOL },
          );

          issues.push(...result.issues);
          if (result.hScroll) sawHScroll = true;
        }

        const details = issues
          .map((x) => `  • step ${x.step + 1} ${x.part}: ${x.reason}`)
          .join("\n");

        expect(
          sawHScroll,
          `Page developed horizontal scroll during the approach animation at ${vp.width}x${vp.height} (${lang})`,
        ).toBe(false);

        expect(
          issues.length,
          `Active approach card clipped text at ${vp.width}x${vp.height} (${lang}):\n${details}`,
        ).toBe(0);
      });
    }
  });
}
