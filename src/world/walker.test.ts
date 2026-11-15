import { expect, test } from "vitest";
import { NODES, STANDS } from "./voxel/routes";
import { walker } from "./walker";

/** Runs the clock until he stops, and says how long that took. */
function finish() {
  let seconds = 0;
  while (walker.moving && seconds < 20) {
    walker.advance(0.05);
    seconds += 0.05;
  }
  return seconds;
}

test("he runs from the lookout to the studio in a few seconds and turns to the easel", () => {
  walker.place("home");
  expect([walker.x, walker.z]).toEqual(NODES.lookout);
  expect(walker.go("design")).toBe(true);
  expect(walker.moving).toBe(true);
  walker.advance(0.5);
  expect(walker.progress).toBeGreaterThan(0);
  expect(walker.progress).toBeLessThan(1);
  expect(walker.speed).toBeGreaterThan(5);
  const seconds = finish();
  expect(seconds).toBeGreaterThan(1.5);
  expect(seconds).toBeLessThan(3.6);
  expect(walker.x).toBeCloseTo(NODES.design[0]);
  expect(walker.z).toBeCloseTo(NODES.design[1]);
  expect(walker.heading).toBe(STANDS.design.facing);
  expect(walker.speed).toBe(0);
  expect(walker.section).toBe("design");
});

test("home and about share a spot, so there is nowhere to run", () => {
  walker.place("home");
  expect(walker.go("about")).toBe(false);
  expect(walker.moving).toBe(false);
  expect(walker.section).toBe("about");
});

test("he can be sent somewhere else while still running", () => {
  walker.place("home");
  walker.go("play");
  walker.advance(1);
  const z = walker.z;
  expect(z).toBeLessThan(NODES.lookout[1]);
  expect(walker.go("home")).toBe(true);
  // He sets off from where he was, not from a jump.
  walker.advance(0.01);
  expect(Math.abs(walker.z - z)).toBeLessThan(1);
  finish();
  expect(walker.x).toBeCloseTo(NODES.lookout[0]);
  expect(walker.z).toBeCloseTo(NODES.lookout[1]);
  // Changing his mind twice in a row still works.
  walker.go("code");
  walker.advance(0.4);
  walker.go("design");
  walker.advance(0.4);
  walker.go("code");
  finish();
  expect(walker.x).toBeCloseTo(NODES.code[0]);
  expect(walker.z).toBeCloseTo(NODES.code[1]);
});

test("he stands on the ground wherever he stops", () => {
  walker.place("code");
  expect(walker.y).toBe(3);
  walker.place("home");
  // The lookout is seven blocks up, and he stands on a thin stone slab there.
  expect(walker.y).toBeCloseTo(7.2);
});
