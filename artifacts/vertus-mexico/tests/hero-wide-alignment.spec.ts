import { test, expect } from "@playwright/test";

/**
 * Guards the hero layout on very wide desktops (1440–2560px).
 *
 * The hero was fixed so the eyebrow, headline, CTA, lead paragraph, and
 * footnote all align inside one centered max-width container. Nothing else
 * enforces this — a future style tweak (e.g. dropping the shared max-width
 * wrapper around the lead/footnote, or changing hero padding) could silently
 * push the lead paragraph back to the viewport edge on a 2560px monitor.
 *
 * This spec renders the landing page at wide desktop viewports in both
 * languages and asserts:
 *  1) The headline, CTA, lead paragraph, and footnote share the same left
 *     edge (sub-pixel tolerance). The eyebrow is allowed its deliberate small
 *     optical inset (marginLeft: 5px in App.tsx) but must stay within a few
 *     pixels of that edge — anything larger means the shared container broke.
 *  2) The headline renders exactly two lines that match its authored line
 *     break (`\n` in content.ts, rendered via white-space: pre-line) — never
 *     a stubby extra line from unwanted wrapping, never a collapse to one
 *     line, and never a re-wrap at a different word than the authored break.
 */

const LANGS = ["es", "en"] as const;

// Wide desktop widths the fix targeted. 1440 is the lower bound of the fixed
// range; 1920 and 2560 are the common wide/ultrawide monitor widths.
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const;

// Sub-pixel rounding tolerance for elements that must share an edge exactly.
const ALIGN_TOL = 1.5;
// The eyebrow carries an intentional 5px optical inset. Allow that inset plus
// rounding, but nothing more.
const EYEBROW_MAX_INSET = 5 + ALIGN_TOL;

type HeroMeasurement = {
  missing: string[];
  lefts: Record<string, number>;
  renderedLines: string[];
  expectedLines: string[];
  headlineText: string;
};

async function measureHero(page: import("@playwright/test").Page) {
  return page.evaluate((): HeroMeasurement => {
    const section = document.querySelector<HTMLElement>("section#top");
    const missing: string[] = [];
    if (!section) {
      return {
        missing: ["section#top"],
        lefts: {},
        renderedLines: [],
        expectedLines: [],
        headlineText: "",
      };
    }

    const eyebrow = section.querySelector<HTMLElement>("span");
    const headline = section.querySelector<HTMLElement>("h1");
    const cta = section.querySelector<HTMLElement>("a.vx-cta");
    const paragraphs = section.querySelectorAll<HTMLElement>("p");
    const lead = paragraphs[0] ?? null;
    const footnote = paragraphs[1] ?? null;

    const named: Array<[string, HTMLElement | null]> = [
      ["eyebrow", eyebrow],
      ["headline", headline],
      ["cta", cta],
      ["lead paragraph", lead],
      ["footnote", footnote],
    ];

    const lefts: Record<string, number> = {};
    for (const [name, el] of named) {
      if (!el) {
        missing.push(name);
        continue;
      }
      lefts[name] = el.getBoundingClientRect().left;
    }

    // Reconstruct the headline's rendered lines by measuring each word's
    // client rect and grouping words by vertical position. Comparing these
    // against the authored `\n` split catches an unwanted extra wrapped line,
    // a collapse to a single line, AND a re-wrap at the wrong word (which
    // keeps the line count but breaks the "two clean lines" design).
    const renderedLines: string[] = [];
    let expectedLines: string[] = [];
    if (headline) {
      const raw = headline.textContent ?? "";
      expectedLines = raw
        .split("\n")
        .map((s) => s.replace(/\s+/g, " ").trim())
        .filter((s) => s.length > 0);

      type Word = { text: string; top: number; height: number };
      const words: Word[] = [];
      const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const data = (node as Text).data;
        const re = /\S+/g;
        let match: RegExpExecArray | null;
        while ((match = re.exec(data))) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            words.push({ text: match[0], top: rect.top, height: rect.height });
          }
        }
      }

      const wordsTops: number[] = [];
      for (const w of words) {
        const last = renderedLines.length - 1;
        if (
          last >= 0 &&
          Math.abs(w.top - wordsTops[last]) < w.height / 2
        ) {
          renderedLines[last] += ` ${w.text}`;
        } else {
          renderedLines.push(w.text);
          wordsTops.push(w.top);
        }
      }
    }

    return {
      missing,
      lefts,
      renderedLines,
      expectedLines,
      headlineText: headline?.textContent?.trim() ?? "",
    };
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`Hero alignment @ ${viewport.width}px`, () => {
    // Force this desktop width regardless of the config project.
    test.use({ viewport: { ...viewport } });

    for (const lang of LANGS) {
      test(`hero elements share a left edge at ${viewport.width}px (${lang})`, async ({
        page,
      }) => {
        await page.goto(`/?lang=${lang}`);
        await page.waitForLoadState("networkidle");

        const m = await measureHero(page);

        expect(
          m.missing,
          `Hero elements not found at ${viewport.width}px (${lang}): ${m.missing.join(", ")}`,
        ).toEqual([]);

        const anchor = m.lefts["headline"];
        const report = Object.entries(m.lefts)
          .map(([name, left]) => `  • ${name}: left=${left.toFixed(1)}px`)
          .join("\n");

        for (const name of ["cta", "lead paragraph", "footnote"] as const) {
          expect(
            Math.abs(m.lefts[name] - anchor),
            `"${name}" is misaligned with the headline at ${viewport.width}px (${lang}) — expected the same left edge (±${ALIGN_TOL}px).\n${report}`,
          ).toBeLessThanOrEqual(ALIGN_TOL);
        }

        // The eyebrow may sit up to its intentional 5px optical inset to the
        // right of the headline, but never to the left of it and never
        // further right than the inset allows.
        const eyebrowOffset = m.lefts["eyebrow"] - anchor;
        expect(
          eyebrowOffset,
          `Eyebrow drifted left of the headline at ${viewport.width}px (${lang}).\n${report}`,
        ).toBeGreaterThanOrEqual(-ALIGN_TOL);
        expect(
          eyebrowOffset,
          `Eyebrow drifted right of its allowed 5px optical inset at ${viewport.width}px (${lang}).\n${report}`,
        ).toBeLessThanOrEqual(EYEBROW_MAX_INSET);
      });

      test(`headline renders exactly two lines at ${viewport.width}px (${lang})`, async ({
        page,
      }) => {
        await page.goto(`/?lang=${lang}`);
        await page.waitForLoadState("networkidle");

        const m = await measureHero(page);

        expect(
          m.missing,
          `Hero elements not found at ${viewport.width}px (${lang}): ${m.missing.join(", ")}`,
        ).toEqual([]);

        const rendered = m.renderedLines.map((s) =>
          s.replace(/\s+/g, " ").trim(),
        );

        // The authored content must still contain exactly one explicit line
        // break (two segments) — if content.ts loses the `\n`, that is a
        // regression of the "two clean lines" design too.
        expect(
          m.expectedLines.length,
          `Headline "${m.headlineText}" no longer contains exactly one authored line break at ${viewport.width}px (${lang}) — content.ts heroTitle should have exactly one "\\n".`,
        ).toBe(2);

        expect(
          rendered.length,
          `Headline "${m.headlineText}" rendered ${rendered.length} line(s) at ${viewport.width}px (${lang}) — expected exactly 2 (one clean wrap, no stubby extra line). Rendered lines: ${JSON.stringify(rendered)}`,
        ).toBe(2);

        // Each rendered line must match the authored segment — a re-wrap at a
        // different word (e.g. a stubby one-word line) fails even when the
        // total line count is still 2.
        expect(
          rendered,
          `Headline wrapped at the wrong word at ${viewport.width}px (${lang}). Rendered: ${JSON.stringify(rendered)}, expected: ${JSON.stringify(m.expectedLines)}`,
        ).toEqual(m.expectedLines);
      });
    }
  });
}
