import { expect, test } from "vitest";
import { DRAW_SECONDS, FAN_SECONDS, FRONT, SHEET, SHEET_KINDS, fanSlot, patchShare, sheetArt, sheetTarget, stagePips } from "./sheets";

const colours: [string, string, string] = ["#c8553d", "#e8c15a", "#2f7f79"];

test("every kind of sheet has a picture that stays on its paper", () => {
  for (const kind of SHEET_KINDS) {
    const art = sheetArt(kind, colours);
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

test("the fan is even, mirrored left to right, and its sheets do not sit on each other", () => {
  const slots = [0, 1, 2, 3].map((i) => fanSlot(i, 4));
  expect(slots[0].x).toBeCloseTo(-slots[3].x);
  expect(slots[1].x).toBeCloseTo(-slots[2].x);
  expect(slots[0].y).toBeCloseTo(slots[3].y);
  expect(slots[0].turn).toBeCloseTo(-slots[3].turn);
  for (let i = 1; i < 4; i++) expect(slots[i].x - slots[i - 1].x).toBeGreaterThan(1.1);
  // Outer sheets hang lower than inner ones, as in a hand of cards.
  expect(slots[0].y).toBeLessThan(slots[1].y);
});

test("a lone sheet stands straight up in the middle", () => {
  expect(fanSlot(0, 1)).toMatchObject({ x: 0, turn: 0 });
});

test("closed, every sheet is packed away", () => {
  for (let i = 0; i < 4; i++) expect(sheetTarget(i, 4, { open: false, since: 99, front: -1 }).shown).toBe(false);
});

test("opening, the sheets come out one after another and are all out within the time allowed", () => {
  const out = (since: number) => [0, 1, 2, 3].filter((i) => sheetTarget(i, 4, { open: true, since, front: -1 }).shown).length;
  expect(out(0)).toBe(0);
  const counts = [0.2, 0.6, 0.9, 1.2, FAN_SECONDS].map(out);
  for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
  expect(out(FAN_SECONDS)).toBe(4);
  expect(FAN_SECONDS).toBeLessThan(3);
  expect(sheetTarget(2, 4, { open: true, since: FAN_SECONDS, front: -1 })).toMatchObject(fanSlot(2, 4));
});

test("with motion off they are all out at once", () => {
  for (let i = 0; i < 4; i++) expect(sheetTarget(i, 4, { open: true, since: 0, front: -1, still: true }).shown).toBe(true);
});

test("the picked sheet comes to the front, larger and upright; the rest keep their places", () => {
  const picked = sheetTarget(1, 4, { open: true, since: 9, front: 1 });
  expect(picked).toMatchObject({ x: FRONT.x, y: FRONT.y, z: FRONT.z, turn: 0, size: FRONT.size });
  expect(picked.size).toBeGreaterThan(fanSlot(1, 4).size);
  expect(sheetTarget(2, 4, { open: true, since: 9, front: 1 })).toMatchObject(fanSlot(2, 4));
});

test("picking a sheet brings it out even if the fan has not got to it yet", () => {
  expect(sheetTarget(3, 4, { open: true, since: 0, front: 3 }).shown).toBe(true);
});

test("a picked sheet draws itself: nothing at first, patch by patch in order, all there at the end", () => {
  const at = (since: number) => [0, 1, 2, 3, 4].map((k) => patchShare(k, 5, since));
  expect(at(0)).toEqual([0, 0, 0, 0, 0]);
  const mid = at(DRAW_SECONDS / 2);
  for (let k = 1; k < 5; k++) expect(mid[k]).toBeLessThanOrEqual(mid[k - 1]);
  expect(mid[0]).toBe(1);
  expect(mid[4]).toBeLessThan(1);
  expect(at(DRAW_SECONDS)).toEqual([1, 1, 1, 1, 1]);
  expect(DRAW_SECONDS).toBeLessThan(1);
  expect(patchShare(0, 1, DRAW_SECONDS)).toBe(1);
});

test("each sheet carries its place in the order as a row of pips", () => {
  expect(stagePips(0)).toHaveLength(1);
  expect(stagePips(3)).toHaveLength(4);
  for (const p of stagePips(4)) expect(p.x + p.w).toBeLessThanOrEqual(1);
});

test("the picked sheet is held above the easel, clear of the finished piece on it", () => {
  // The canvas tops out at 2.3; the sheet's lower edge must be above that.
  expect(FRONT.y - (SHEET.h * FRONT.size) / 2).toBeGreaterThan(2.3);
  expect(SHEET.w * FRONT.size).toBeGreaterThan(3);
});
