import { test, expect } from "@playwright/test";

test.describe("Team section heading layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("h2 spans full width (wider than 50% of section content width)", async ({
    page,
  }) => {
    const section = page.locator("#equipo");
    await section.scrollIntoViewIfNeeded();

    const result = await page.evaluate(() => {
      const sec = document.getElementById("equipo");
      if (!sec) return { error: "Section #equipo not found" };

      const h2 = sec.querySelector("h2");
      if (!h2) return { error: "h2 not found inside #equipo" };

      const secStyles = window.getComputedStyle(sec);
      const paddingLeft = parseFloat(secStyles.paddingLeft) || 0;
      const paddingRight = parseFloat(secStyles.paddingRight) || 0;
      const sectionContentWidth =
        sec.getBoundingClientRect().width - paddingLeft - paddingRight;

      const h2Width = h2.getBoundingClientRect().width;
      const ratio = h2Width / sectionContentWidth;

      return {
        sectionContentWidth,
        h2Width,
        ratio,
      };
    });

    expect(result, "Elements must be found in DOM").not.toHaveProperty("error");

    const { ratio, h2Width, sectionContentWidth } = result as {
      ratio: number;
      h2Width: number;
      sectionContentWidth: number;
    };

    expect(
      ratio,
      `h2 width (${h2Width.toFixed(1)}px) should be wider than 50% of section content width (${sectionContentWidth.toFixed(1)}px), but ratio was ${(ratio * 100).toFixed(1)}%`,
    ).toBeGreaterThan(0.5);
  });

  test("h2 is not inside a column (not a descendant of the two-column grid)", async ({
    page,
  }) => {
    const section = page.locator("#equipo");
    await section.scrollIntoViewIfNeeded();

    const result = await page.evaluate(() => {
      const sec = document.getElementById("equipo");
      if (!sec) return { error: "Section #equipo not found" };

      const h2 = sec.querySelector("h2");
      if (!h2) return { error: "h2 not found inside #equipo" };

      const twoColGrids = Array.from(
        sec.querySelectorAll<HTMLElement>("[style*='1fr 1fr']"),
      );

      const insideGrid = twoColGrids.some((grid) => grid.contains(h2));
      return { insideGrid };
    });

    expect(result).not.toHaveProperty("error");
    expect(
      (result as { insideGrid: boolean }).insideGrid,
      "Team h2 must not be inside the two-column grid — it should be above it at full width",
    ).toBe(false);
  });
});
