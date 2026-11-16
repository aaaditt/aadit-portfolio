import { expect, test } from "vitest";
import { GLYPHS, pixelText, textWidth } from "./lettering";

test("every glyph is three pixels wide and five tall", () => {
  for (const [letter, rows] of Object.entries(GLYPHS)) {
    expect(rows.length, letter).toBe(5);
    for (const row of rows) expect(row.length, letter).toBe(3);
  }
});

test("a word is laid out left to right, centred on the origin, one block per lit pixel", () => {
  const boxes = pixelText("LAB", 0.1, "#fff");
  const lit = ["L", "A", "B"].reduce((n, l) => n + GLYPHS[l].join("").split("#").length - 1, 0);
  expect(boxes).toHaveLength(lit);
  // Three letters of three pixels with a pixel between: 11 pixels across.
  expect(textWidth("LAB", 0.1)).toBeCloseTo(1.1);
  const xs = boxes.map(([x]) => x);
  expect(Math.min(...xs)).toBeCloseTo(-0.55);
  expect(Math.max(...xs)).toBeCloseTo(0.45);
  // Five pixels tall, standing on y = 0.
  expect(Math.min(...boxes.map(([, y]) => y))).toBeCloseTo(0);
  expect(Math.max(...boxes.map(([, y]) => y))).toBeCloseTo(0.4);
});

test("letters it does not know are left as gaps, not errors", () => {
  expect(pixelText("A?", 0.1, "#fff").length).toBe(pixelText("A", 0.1, "#fff").length);
});
