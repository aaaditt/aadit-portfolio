import { expect, test } from "vitest";
import { COUNT_SECONDS, CROWD_MAX, countAt, crowdAt, crowdInAfter, crowdSize, crowdSpot, stageLight } from "./fairRule";

test("a bigger event draws a bigger crowd, within limits", () => {
  expect(crowdSize(120)).toBeGreaterThan(crowdSize(45));
  expect(crowdSize(4)).toBe(6);
  expect(crowdSize(5000)).toBe(CROWD_MAX);
});

test("nobody in the crowd stands on anybody else, or where he stands by the cart", () => {
  const spots = Array.from({ length: CROWD_MAX }, (_, i) => crowdSpot(i));
  for (let i = 0; i < spots.length; i++) {
    expect(Math.hypot(spots[i].x, spots[i].z)).toBeGreaterThan(2.5);
    expect(spots[i].z).toBeGreaterThan(1);
    for (let j = 0; j < i; j++) expect(Math.hypot(spots[i].x - spots[j].x, spots[i].z - spots[j].z), `${i} and ${j}`).toBeGreaterThan(0.6);
  }
});

test("the crowd walks in from out in front, one after another, and is all in within three seconds", () => {
  const early = crowdAt(0, { open: true, since: 0.2 });
  expect(early.z).toBeGreaterThan(crowdSpot(0).z);
  expect(early.arrived).toBe(false);
  expect(crowdAt(30, { open: true, since: 0.2 }).size).toBe(0);
  const count = CROWD_MAX;
  expect(crowdInAfter(count)).toBeLessThan(3);
  for (let i = 0; i < count; i++) expect(crowdAt(i, { open: true, since: crowdInAfter(count) })).toMatchObject({ ...crowdSpot(i), size: 1, arrived: true });
});

test("closed, the ground is empty; with motion off, the crowd is simply there", () => {
  expect(crowdAt(3, { open: false, since: 9 }).size).toBe(0);
  expect(crowdAt(3, { open: true, since: 0, still: true })).toMatchObject({ ...crowdSpot(3), size: 1 });
});

test("the counter runs up to the real number and never shows more", () => {
  expect(countAt(120, 0)).toBe(0);
  let last = 0;
  for (let t = 0; t <= COUNT_SECONDS + 1; t += 0.05) {
    const n = countAt(120, t);
    expect(n).toBeGreaterThanOrEqual(last);
    expect(n).toBeLessThanOrEqual(120);
    last = n;
  }
  expect(countAt(120, COUNT_SECONDS)).toBe(120);
  expect(countAt(45, 99)).toBe(45);
});

test("the stage lights are steady until an event is on, then one leads the chase", () => {
  expect(new Set([0, 1, 2, 3, 4].map((i) => stageLight(i, 5, 3, false))).size).toBe(1);
  const lit = [0, 1, 2, 3, 4].map((i) => stageLight(i, 5, 3, true));
  expect(lit.filter((b) => b === 1)).toHaveLength(1);
});
