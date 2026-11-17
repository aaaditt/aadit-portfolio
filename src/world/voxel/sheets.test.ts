import { expect, test } from "vitest";
import { SHEET_KINDS, sheetArt } from "./sheets";

const colours: [string, string, string] = ["#c8553d", "#e8c15a", "#2f7f79"];

test("every kind of sheet has a picture that stays on its paper", () => {
  for (const layout of ["blocks", "screen", "poster"] as const) for (const kind of SHEET_KINDS) {
    const art = sheetArt(kind, colours, layout);
    expect(art.length, kind).toBeGreaterThan(3);
    for (const r of art) {
      expect(r.x, kind).toBeGreaterThanOrEqual(0);
      expect(r.y, kind).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w, kind).toBeLessThanOrEqual(1.0001);
      expect(r.y + r.h, kind).toBeLessThanOrEqual(1.0001);
      expect(r.w, kind).toBeGreaterThan(0);
      expect(r.h, kind).toBeGreaterThan(0);
    }
  }
});

test("the palette and the final piece are in the project's own colours; the sketch and wireframe are not", () => {
  const used = (kind: (typeof SHEET_KINDS)[number]) => new Set(sheetArt(kind, colours).map((r) => r.colour));
  for (const c of colours) {
    expect(used("palette").has(c)).toBe(true);
    expect(used("final").has(c)).toBe(true);
    expect(used("sketch").has(c)).toBe(false);
    expect(used("wireframe").has(c)).toBe(false);
  }
});

test("each layout draws a different picture from the same colours", () => {
  const shape = (layout: "blocks" | "screen" | "poster") => JSON.stringify(sheetArt("final", colours, layout));
  expect(shape("blocks")).not.toBe(shape("screen"));
  expect(shape("screen")).not.toBe(shape("poster"));
});
