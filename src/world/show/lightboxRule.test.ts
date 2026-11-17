import { expect, test } from "vitest";
import { HERO, HIS_HEIGHT, IDLE_SECONDS, PEEK_AGAIN, RISE_SECONDS, autoScrub, cellAt, peekAt, planeAt, riseAt, snapTo, squashAt, waveOrder } from "./lightboxRule";

test("the hero sheet stands at least three times his height", () => {
  expect(HERO.h).toBeGreaterThanOrEqual(3 * HIS_HEIGHT);
  expect(HERO.w).toBeGreaterThan(HERO.h);
});

test("the voxels all rise in by one second, after a short beat; with motion off they are simply there", () => {
  const n = HERO.cols * HERO.rows;
  expect(RISE_SECONDS).toBeLessThanOrEqual(1);
  for (let i = 0; i < n; i++) expect(riseAt(i, RISE_SECONDS)).toEqual({ p: 1, grow: 1, done: true });
  // Nothing moves for the first beat, so the eye finds the easel first.
  expect(riseAt(0, 0.15).p).toBe(0);
  expect(riseAt(n - 1, 0.5).done).toBe(false);
  for (let i = 0; i < n; i++) expect(riseAt(i, 0, true)).toEqual({ p: 1, grow: 1, done: true });
});

test("each voxel lands a touch large, about 1.1 times its cell, and settles", () => {
  const peak = Math.max(...Array.from({ length: 100 }, (_, k) => riseAt(0, 0.2 + k * 0.003).grow));
  expect(peak).toBeGreaterThan(1.05);
  expect(peak).toBeLessThan(1.15);
});

test("the wave starts at the foot of the sheet's middle and reaches every cell once", () => {
  const order = waveOrder(HERO.cols, HERO.rows);
  expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: HERO.cols * HERO.rows }, (_, i) => i));
  const first = cellAt(order[0], HERO.cols, HERO.rows);
  const last = cellAt(order[order.length - 1], HERO.cols, HERO.rows);
  expect(first.y).toBeLessThan(0);
  expect(Math.abs(first.x)).toBeLessThan(HERO.w / HERO.cols);
  expect(last.y).toBeGreaterThan(0);
});

test("the cells tile the sheet exactly", () => {
  const cw = HERO.w / HERO.cols;
  const ch = HERO.h / HERO.rows;
  const a = cellAt(0, HERO.cols, HERO.rows);
  expect(a.x).toBeCloseTo(-HERO.w / 2 + cw / 2);
  expect(a.y).toBeCloseTo(-HERO.h / 2 + ch / 2);
  const z = cellAt(HERO.cols * HERO.rows - 1, HERO.cols, HERO.rows);
  expect(z.x).toBeCloseTo(HERO.w / 2 - cw / 2);
  expect(z.y).toBeCloseTo(HERO.h / 2 - ch / 2);
});

test("at rest on a stage, that stage's plane is square on, full size and in front of the rest", () => {
  for (let k = 0; k < 4; k++) {
    const front = planeAt(k, 4, k, 0);
    expect(front).toMatchObject({ x: 0, y: 0, z: 0, turn: 0, size: 1 });
    for (let i = 0; i < 4; i++) if (i !== k) expect(planeAt(i, 4, k, 0).z).toBeLessThan(front.z);
  }
});

test("pulled apart mid-scrub, the four planes stand in stage order, well apart", () => {
  const planes = [0, 1, 2, 3].map((i) => planeAt(i, 4, 1.5, 1));
  for (let i = 1; i < 4; i++) expect(planes[i].x - planes[i - 1].x).toBeGreaterThan(2);
  // Like a hand of cards, each overlaps the next with its name tab showing: the one on the right
  // is in front, except that the planes under the scrub come forward of the rest.
  expect(planes[1].z).toBeGreaterThan(planes[0].z);
  expect(planes[2].z).toBeGreaterThan(planes[1].z);
  expect(planes[2].z).toBeGreaterThan(planes[3].z);
  const settled = [0, 1, 2, 3].map((i) => planeAt(i, 4, 0, 1));
  expect(settled[0].z).toBeGreaterThan(settled[1].z);
  // Scrubbed most of the way to Layout, Colours (partly under the scrub) stays behind Final, so
  // Final's name tab is not covered.
  const leaning = [0, 1, 2, 3].map((i) => planeAt(i, 4, 1.4, 1));
  expect(leaning[1].z).toBeGreaterThan(leaning[2].z);
  expect(leaning[3].z).toBeGreaterThan(leaning[2].z);
  // The one under the scrub is drawn down below the rest, clear of their name tabs.
  const picked = planeAt(1, 4, 1, 1);
  const beside = planeAt(2, 4, 1, 1);
  expect(picked.y).toBeLessThan(beside.y - 1);
  // The ones to the sides turn to face inwards, like cards in a fan.
  expect(planes[0].turn).toBeGreaterThan(0);
  expect(planes[3].turn).toBeLessThan(0);
  // Moved aside, the row keeps its shape.
  expect(planeAt(2, 4, 1.5, 1, { shift: 2 }).x - planes[2].x).toBeCloseTo(2);
  // Made larger, it keeps its order and grows evenly.
  const big = [0, 1, 2, 3].map((i) => planeAt(i, 4, 1.5, 1, { scale: 1.25 }));
  expect(big[3].x - big[0].x).toBeCloseTo((planes[3].x - planes[0].x) * 1.25);
  expect(big[1].size).toBeCloseTo(planes[1].size * 1.25);
});

test("a scrub snaps to the nearest stage, and never past either end", () => {
  expect(snapTo(1.4, 4)).toBe(1);
  expect(snapTo(1.6, 4)).toBe(2);
  expect(snapTo(-0.8, 4)).toBe(0);
  expect(snapTo(7, 4)).toBe(3);
});

test("the peel hint comes soon after the sheet is whole, holds at about 15 degrees, then settles", () => {
  expect(peekAt(0.25)).toBe(0);
  expect(peekAt(0.6)).toBeCloseTo(0.26, 2);
  expect(peekAt(0.75)).toBeCloseTo(0.26, 2);
  expect(Math.abs(peekAt(1.8))).toBeLessThan(0.01);
  expect(peekAt(PEEK_AGAIN)).toBe(0);
  // The second peel, if nobody has touched it, is over before the sheet scrubs on its own.
  expect(peekAt(IDLE_SECONDS - PEEK_AGAIN)).toBe(0);
});

test("letting go squashes the sheet wide and low, overshoots back, and ends square", () => {
  expect(squashAt(0)).toEqual({ x: 1, y: 1 });
  expect(squashAt(0.05).x).toBeGreaterThan(1.05);
  expect(squashAt(0.05).y).toBeLessThan(0.95);
  expect(squashAt(0.15).x).toBeLessThan(1);
  expect(squashAt(0.2)).toEqual({ x: 1, y: 1 });
  expect(squashAt(0.05, true)).toEqual({ x: 1, y: 1 });
});

test("with no touch, the sheet scrubs once on its own and comes back", () => {
  expect(autoScrub(IDLE_SECONDS - 0.1)).toEqual({ offset: 0, spread: 0 });
  const mid = autoScrub(IDLE_SECONDS + 0.9);
  expect(mid.spread).toBeGreaterThan(0.9);
  expect(mid.offset).toBeLessThan(-0.4);
  expect(autoScrub(IDLE_SECONDS + 5)).toEqual({ offset: 0, spread: 0 });
});
