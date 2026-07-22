import { test, expect } from "@playwright/test";

/**
 * Guards readability of the enlarged "Nuestro enfoque" Fibonacci square
 * animation on smaller laptop screens.
 *
 * The animation stage was enlarged to min(96vw,1500px) x min(88vh,1000px)
 * with the focused square at 0.72 of the field's min dimension and bigger
 * text clamps. It was verified at 1440x900 / 1920x1080, but small laptops
 * (~1280x720, ~1024x768) still run the animated mode with tight vertical
 * space. This spec drives the scroll-linked animation to each step's exact
 * focus position and fails if the focused card's number, title, or body text
 * clips against the card (the card has overflow:hidden, so any overflow is
 * silently truncated), or if the page develops horizontal scroll.
 *
 * Spanish copy is the longest, but both languages are checked.
 */

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
] as const;
const LANGS = ["es", "en"] as const;

// The card padding is clamp(24px,3vw,48px); require at least this much
// clearance between text and the card edge so "fits" also means "not cramped".
const MIN_CLEARANCE = 12;
const TOL = 1;

type StepIssue = { step: number; part: string; reason: string };

for (const vp of VIEWPORTS) {
  test.describe(`approach animation @ ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const lang of LANGS) {
      test(`focused squares stay readable (${lang})`, async ({ page }) => {
        // This spec pins its own laptop viewports, so running it again under
        // the "mobile" project would only duplicate the identical desktop run.
        test.skip(
          test.info().project.name !== "desktop",
          "viewports are pinned; desktop project only",
        );
        await page.goto(`/?lang=${lang}`);
        await page.waitForLoadState("networkidle");
        // Let the deferred ScrollTrigger.refresh() (300ms after init) settle.
        await page.waitForTimeout(600);

        // Animated mode must be active at these widths (grid fallback would
        // make this spec vacuous).
        const cards = page.locator("[data-sq-card]");
        const n = await cards.count();
        expect(
          n,
          `Animated approach mode should be active at ${vp.width}px`,
        ).toBeGreaterThan(1);

        // Resolve the scroll track: card -> field -> sticky stage -> track.
        const track = await page.evaluate(() => {
          const card = document.querySelector<HTMLElement>("[data-sq-card]");
          const trackEl =
            card?.parentElement?.parentElement?.parentElement || null;
          if (!trackEl) return null;
          const r = trackEl.getBoundingClientRect();
          return {
            top: r.top + window.scrollY,
            height: r.height,
          };
        });
        expect(track, "approach scroll track should exist").not.toBeNull();
        if (!track) return;

        const issues: StepIssue[] = [];
        let sawHScroll = false;

        for (let i = 0; i < n; i++) {
          // ScrollTrigger runs start "top top" -> end "bottom bottom", so
          // progress = (scrollY - trackTop) / (trackHeight - viewportHeight).
          const frac = i / (n - 1);
          const targetY =
            track.top + frac * (track.height - vp.height);
          await page.evaluate((y) => window.scrollTo(0, y), targetY);
          // Text opacity transitions over 250ms; wait for it to settle.
          await page.waitForTimeout(450);

          const result = await page.evaluate(
            ({ step, minClear, tol }) => {
              const issues: { step: number; part: string; reason: string }[] =
                [];
              const all = Array.from(
                document.querySelectorAll<HTMLElement>("[data-sq-card]"),
              );
              // The focused card is the largest one on screen.
              let focused: HTMLElement | null = null;
              let maxW = 0;
              for (const el of all) {
                const w = el.getBoundingClientRect().width;
                if (w > maxW) {
                  maxW = w;
                  focused = el;
                }
              }
              if (!focused) {
                issues.push({
                  step,
                  part: "card",
                  reason: "no focused card found",
                });
                return { issues, hScroll: false };
              }
              const card = focused.getBoundingClientRect();
              const parts: [string, string][] = [
                ["number", "[data-sq-num]"],
                ["title", "[data-sq-title]"],
                ["body", "[data-sq-body]"],
              ];
              for (const [name, sel] of parts) {
                const el = focused.querySelector<HTMLElement>(sel);
                if (!el) {
                  issues.push({ step, part: name, reason: "missing element" });
                  continue;
                }
                // On the focused card every text tier must be shown.
                if (el.style.opacity !== "" && el.style.opacity !== "1") {
                  issues.push({
                    step,
                    part: name,
                    reason: `hidden on focused card (opacity ${el.style.opacity})`,
                  });
                  continue;
                }
                const r = el.getBoundingClientRect();
                if (r.bottom > card.bottom - minClear + tol) {
                  issues.push({
                    step,
                    part: name,
                    reason: `bottom ${r.bottom.toFixed(1)}px too close to card bottom ${card.bottom.toFixed(1)}px (needs ${minClear}px clearance; card overflow:hidden clips it)`,
                  });
                }
                if (r.right > card.right - minClear + tol) {
                  issues.push({
                    step,
                    part: name,
                    reason: `right ${r.right.toFixed(1)}px too close to card right ${card.right.toFixed(1)}px (needs ${minClear}px clearance)`,
                  });
                }
                if (r.top < card.top + minClear - tol) {
                  issues.push({
                    step,
                    part: name,
                    reason: `top ${r.top.toFixed(1)}px above safe area of card top ${card.top.toFixed(1)}px`,
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
          `Focused approach squares clipped or hid text at ${vp.width}x${vp.height} (${lang}):\n${details}`,
        ).toBe(0);
      });
    }
  });
}
