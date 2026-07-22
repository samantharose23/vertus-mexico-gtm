import { test, expect } from "@playwright/test";

/**
 * Guards against the mobile CTA overflow / clipping bug.
 *
 * The landing page uses fixed-height, no-wrap CTA buttons whose labels differ
 * per language (Spanish labels run longer than English). On a narrow phone a
 * long label can silently overflow its container and clip. This spec loads the
 * site across the full range of representative phone widths in both English and
 * Spanish and fails if any CTA button (.vx-cta, .vx-wa, .vx-resource-cta,
 * .vx-link) overflows the viewport or its parent, clips its own label, or if the
 * page develops horizontal scroll.
 *
 * The single 320px check missed regressions at mid-size phones (360/375/390/414)
 * where a slightly longer label or wider layout could clip while 320px passed.
 */

const CTA_SELECTORS = [".vx-cta", ".vx-wa", ".vx-resource-cta", ".vx-link"];
const LANGS = ["es", "en"] as const;

// Representative phone widths: the narrowest realistic phone (320) plus the
// common mid-size widths that real devices sit at (360/375/390/414).
const WIDTHS = [320, 360, 375, 390, 414] as const;

type Overflow = {
  selector: string;
  index: number;
  text: string;
  reason: string;
};

for (const width of WIDTHS) {
  test.describe(`CTA overflow @ ${width}px`, () => {
    // Force this phone width regardless of the config project.
    test.use({ viewport: { width, height: 800 } });

    for (const lang of LANGS) {
      test(`CTA buttons do not overflow at ${width}px (${lang})`, async ({
        page,
      }) => {
        await page.goto(`/?lang=${lang}`);
        await page.waitForLoadState("networkidle");

        const result = await page.evaluate((selectors) => {
          const TOL = 1; // sub-pixel rounding tolerance
          const overflows: Overflow[] = [];

          // 1) Page must not develop horizontal scroll.
          const docScrollWidth = document.documentElement.scrollWidth;
          const viewportWidth = window.innerWidth;
          const pageHasHScroll = docScrollWidth > viewportWidth + TOL;

          // 2) Inspect every CTA button.
          for (const selector of selectors) {
            const els = Array.from(
              document.querySelectorAll<HTMLElement>(selector),
            );
            els.forEach((el, index) => {
              const rect = el.getBoundingClientRect();
              // Skip anything not rendered (0-size / display:none).
              if (rect.width === 0 && rect.height === 0) return;

              const text = (el.textContent || "").trim().slice(0, 60);
              const reasons: string[] = [];

              // a) Overflows the viewport horizontally.
              if (rect.right > viewportWidth + TOL) {
                reasons.push(
                  `right edge ${rect.right.toFixed(1)}px exceeds viewport ${viewportWidth}px`,
                );
              }
              if (rect.left < -TOL) {
                reasons.push(`left edge ${rect.left.toFixed(1)}px is off-screen`);
              }

              // b) Label clips inside the fixed-height, no-wrap button.
              if (el.scrollWidth > el.clientWidth + TOL) {
                reasons.push(
                  `content clips (scrollWidth ${el.scrollWidth}px > clientWidth ${el.clientWidth}px)`,
                );
              }

              // c) Spills out of its parent's visible box. The clip boundary for
              //    overflow:hidden is the padding-box (border-box minus borders),
              //    not the content-box — a child may legitimately sit inside the
              //    parent's padding. We measure against the padding-box so we only
              //    flag genuine spill-out / clipping, not benign padding overlap.
              const parent = el.parentElement;
              if (parent) {
                const pRect = parent.getBoundingClientRect();
                const cs = window.getComputedStyle(parent);
                const borderL = parseFloat(cs.borderLeftWidth) || 0;
                const borderR = parseFloat(cs.borderRightWidth) || 0;
                const clipLeft = pRect.left + borderL;
                const clipRight = pRect.right - borderR;
                // Skip parents that scroll horizontally on purpose.
                const parentScrolls =
                  cs.overflowX === "auto" || cs.overflowX === "scroll";
                if (!parentScrolls) {
                  if (rect.right > clipRight + TOL) {
                    reasons.push(
                      `overflows parent right by ${(rect.right - clipRight).toFixed(1)}px`,
                    );
                  }
                  if (rect.left < clipLeft - TOL) {
                    reasons.push(
                      `overflows parent left by ${(clipLeft - rect.left).toFixed(1)}px`,
                    );
                  }
                }
              }

              if (reasons.length > 0) {
                overflows.push({
                  selector,
                  index,
                  text,
                  reason: reasons.join("; "),
                });
              }
            });
          }

          return { pageHasHScroll, docScrollWidth, viewportWidth, overflows };
        }, CTA_SELECTORS);

        const details = result.overflows
          .map((o) => `  • ${o.selector}[${o.index}] "${o.text}" — ${o.reason}`)
          .join("\n");

        expect(
          result.pageHasHScroll,
          `Page developed horizontal scroll at ${width}px (${lang}) (scrollWidth ${result.docScrollWidth}px > viewport ${result.viewportWidth}px)`,
        ).toBe(false);

        expect(
          result.overflows.length,
          `CTA buttons overflowed/clipped at ${width}px (${lang}):\n${details}`,
        ).toBe(0);
      });
    }
  });
}
