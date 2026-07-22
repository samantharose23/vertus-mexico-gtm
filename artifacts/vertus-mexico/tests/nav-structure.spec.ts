import { test, expect, type Page } from "@playwright/test";

/**
 * Guards the Task #86 nav + section-order restructuring.
 *
 * Nav (both languages):
 *   - exactly 5 section links, in order:
 *     #permanece, #capital, #mexico, #fundadores, #contacto
 *   - the Contact link is a plain text nav link (styled like the others,
 *     no button/pill), visible at all desktop widths
 *   - the logo links back to the hero (#top)
 *
 * Page flow: hero -> permanece -> capital -> Established-in-Mexico proof
 * cluster (testimonials + map + team/stats) -> fundadores -> enfoque ->
 * FAQ -> contact.
 */

const CONSENT_STORAGE_KEY = "vertus_consent";

const EXPECTED_NAV_HREFS = [
  "#permanece",
  "#capital",
  "#mexico",
  "#fundadores",
  "#contacto",
];

const EXPECTED_LABELS: Record<string, string[]> = {
  es: [
    "Lo que permanece",
    "Por qué el capital permanente",
    "Equipo",
    "Para fundadores",
    "Contacto",
  ],
  en: [
    "What stays the same",
    "Why permanent capital",
    "Team",
    "For founders",
    "Contact",
  ],
};

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

test.describe("desktop nav structure @ 1280px", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const lang of ["es", "en"] as const) {
    test(`5 links in order incl. plain-text Contact link (${lang})`, async ({
      page,
    }) => {
      await dismissConsent(page);
      await page.goto(`/?lang=${lang}`);
      await page.waitForLoadState("networkidle");

      const links = page.locator("header nav a.vx-navlink");
      await expect(links).toHaveCount(EXPECTED_NAV_HREFS.length);
      for (let i = 0; i < EXPECTED_NAV_HREFS.length; i++) {
        await expect(links.nth(i)).toHaveAttribute(
          "href",
          EXPECTED_NAV_HREFS[i],
        );
        await expect(links.nth(i)).toHaveText(EXPECTED_LABELS[lang][i]);
      }

      // Contact is a plain text nav link (no button/pill styling).
      const cta = page.getByTestId("link-nav-cta");
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute("href", "#contacto");
      await expect(cta).toHaveClass(/vx-navlink/);
      await expect(cta).not.toHaveClass(/vx-cta/);
      const shape = await cta.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, radius: cs.borderRadius };
      });
      expect(shape.bg).toBe("rgba(0, 0, 0, 0)");
      expect(shape.radius === "0px" || shape.radius === "").toBe(true);

      // Logo links back to the hero.
      await expect(
        page.locator('header a[href="#top"]').first(),
      ).toBeVisible();
    });
  }

  test("Contact link stays visible at 1024px without wrapping the header", async ({
    page,
  }) => {
    await dismissConsent(page);
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const cta = page.getByTestId("link-nav-cta");
    await expect(cta).toBeVisible();
    const header = page.locator("header");
    const box = await header.boundingBox();
    expect(box!.height).toBeLessThan(90);
  });
});

test.describe("section order", () => {
  test("sections appear in the restructured order", async ({ page }) => {
    await dismissConsent(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const order = await page.evaluate(() => {
      const labels = Array.from(
        document.querySelectorAll<HTMLElement>("section[data-screen-label]"),
      ).map((el) => el.dataset.screenLabel || "");
      return labels;
    });

    const expected = [
      "01 Hero",
      "02 What stays the same",
      "03 Why permanent capital",
      "04 Established in Mexico",
      "04b Mexico City",
      "04c Team",
      "05 For founders",
      "06 Our approach",
      "07 FAQ",
      "08 Your contact",
      "09 Get in touch",
    ];
    expect(order, `section flow drifted: ${order.join(" -> ")}`).toEqual(
      expected,
    );

    // The proof cluster is anchored by a single #mexico id: #ubicacion is
    // gone, and #equipo (kept only for deep links) sits inside the same
    // wrapper element as #mexico.
    const cluster = await page.evaluate(() => {
      const mexico = document.getElementById("mexico");
      const equipo = document.getElementById("equipo");
      return {
        ubicacion: !!document.getElementById("ubicacion"),
        sameWrapper:
          !!mexico &&
          !!equipo &&
          mexico.parentElement === equipo.parentElement,
      };
    });
    expect(cluster.ubicacion, "#ubicacion anchor should be removed").toBe(
      false,
    );
    expect(
      cluster.sameWrapper,
      "#mexico and #equipo must share the same proof-section wrapper",
    ).toBe(true);
  });
});
