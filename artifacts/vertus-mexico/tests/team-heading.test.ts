import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const appSource = readFileSync(
  resolve(__dirname, "../src/App.tsx"),
  "utf-8",
);

function extractEquipoSection(src: string): string {
  const openMarker = 'id="equipo"';
  const start = src.indexOf(openMarker);
  if (start === -1) return "";
  const closeTag = "</section>";
  const end = src.indexOf(closeTag, start);
  if (end === -1) return src.slice(start);
  return src.slice(start, end + closeTag.length);
}

const equipoSection = extractEquipoSection(appSource);

describe("Team section heading structure (regression guard)", () => {
  it('Section with id="equipo" exists in App.tsx', () => {
    expect(equipoSection, 'id="equipo" must exist in App.tsx').not.toBe("");
  });

  it("h2 element appears before the two-column grid inside #equipo", () => {
    const twoColMarker = 'twoColStyle("1fr 1fr")';
    const twoColPos = equipoSection.indexOf(twoColMarker);
    expect(
      twoColPos,
      `Two-column grid (${twoColMarker}) must exist inside the #equipo section`,
    ).toBeGreaterThan(-1);

    const h2Pos = equipoSection.indexOf("<h2");
    expect(
      h2Pos,
      "An <h2> element must exist inside the #equipo section",
    ).toBeGreaterThan(-1);

    expect(
      h2Pos,
      "The Team <h2> must appear BEFORE the two-column grid wrapper — " +
        "it should span full width, not be constrained inside a column",
    ).toBeLessThan(twoColPos);
  });

  it("h2 element is not nested inside the two-column grid wrapper", () => {
    const twoColMarker = 'twoColStyle("1fr 1fr")';
    const twoColPos = equipoSection.indexOf(twoColMarker);
    expect(twoColPos).toBeGreaterThan(-1);

    const afterGrid = equipoSection.slice(twoColPos);
    const gridEnd = afterGrid.indexOf("</div>\n          </div>\n        </section>");
    const gridContent = gridEnd !== -1 ? afterGrid.slice(0, gridEnd) : afterGrid;

    const innerH2Pos = gridContent.indexOf("<h2");
    expect(
      innerH2Pos,
      "No <h2> should appear inside the two-column grid content — " +
        "if found, the heading has regressed into a column",
    ).toBe(-1);
  });
});
