import { expect, test } from "vitest";
import { PART, RUN_SECONDS, builtAfter, partSlot, partTarget, runAt } from "./machineRule";

test("the row is centred over the terminal and its blocks do not touch", () => {
  for (const n of [3, 4, 5]) {
    const row = Array.from({ length: n }, (_, i) => partSlot(i, n));
    expect(row[0].x).toBeCloseTo(-row[n - 1].x);
    for (let i = 1; i < n; i++) expect(row[i].x - row[i - 1].x).toBeGreaterThan(PART.size);
  }
});

test("blocks come out one after another, and are all out soon enough that nobody waits", () => {
  const now = { open: true, picked: -1 };
  expect(partTarget(0, 4, { ...now, since: 0 }).shown).toBe(false);
  expect(partTarget(0, 4, { ...now, since: 0.3 }).shown).toBe(true);
  expect(partTarget(3, 4, { ...now, since: 0.3 }).shown).toBe(false);
  for (let i = 0; i < 5; i++) expect(partTarget(i, 5, { ...now, since: builtAfter(5) }).shown).toBe(true);
  expect(builtAfter(5)).toBeLessThan(2);
});

test("closed, every block is packed away; with motion off, none waits its turn", () => {
  expect(partTarget(2, 4, { open: false, since: 9, picked: 2 }).shown).toBe(false);
  expect(partTarget(3, 4, { open: true, since: 0, picked: -1, still: true }).shown).toBe(true);
});

test("a picked block lifts out of the row and grows; the others stay put", () => {
  const picked = partTarget(1, 4, { open: true, since: 9, picked: 1 });
  const other = partTarget(2, 4, { open: true, since: 9, picked: 1 });
  expect(picked.y).toBeGreaterThan(other.y);
  expect(picked.size).toBeGreaterThan(other.size);
  expect(other).toEqual(partSlot(2, 4));
});

test("a run lights the blocks left to right, ends on the last one, and is short", () => {
  expect(runAt(4, -1)).toMatchObject({ on: false, lit: 0, done: false });
  let last = 0;
  for (let t = 0; t <= RUN_SECONDS; t += 0.05) {
    const run = runAt(4, t);
    expect(run.lit).toBeGreaterThanOrEqual(last);
    last = run.lit;
  }
  expect(runAt(4, 0).lit).toBe(0);
  expect(runAt(4, RUN_SECONDS)).toMatchObject({ on: false, lit: 4, done: true });
  expect(RUN_SECONDS).toBeLessThan(3);
});
