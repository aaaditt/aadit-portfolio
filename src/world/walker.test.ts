import { expect, test } from "vitest";
import { EXHIBITS, exhibit } from "./voxel/exhibitData";
import { NODES, STANDS, standAt } from "./voxel/routes";
import { groundY, heightAt } from "./voxel/terrain";
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
  expect(walker.x).toBeCloseTo(NODES[STANDS.design.node][0]);
  expect(walker.z).toBeCloseTo(NODES[STANDS.design.node][1]);
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
  walker.go("events");
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
  expect(walker.x).toBeCloseTo(NODES[STANDS.code.node][0]);
  expect(walker.z).toBeCloseTo(NODES[STANDS.code.node][1]);
});

test("he stands on the ground wherever he stops", () => {
  walker.place("design");
  expect(walker.y).toBe(3);
  walker.place("home");
  // The lookout is seven blocks up, and he stands on a thin stone slab there.
  expect(walker.y).toBeCloseTo(7.2);
});

test("opening a project sends him to its exhibit, where he faces it; going back to the list, he waits in the yard", () => {
  walker.place("home");
  walker.go("code", "code-3");
  finish();
  expect([walker.x, walker.z]).toEqual(NODES["code-3"]);
  expect(walker.exhibit).toBe("code-3");
  expect(walker.heading).toBe(standAt("code-3").facing);
  // He works in front of it, close enough to reach: not off to one side.
  const e = exhibit("code-3");
  expect(walker.z).toBeGreaterThan(e.z);
  expect(Math.hypot(walker.x - e.x, walker.z - e.z)).toBeLessThan(2);
  expect(walker.focus).toEqual({ x: e.x, z: e.z });

  // The next project along is a short hop, not a trip round the village.
  expect(walker.go("code", "code-2")).toBe(true);
  expect(finish()).toBeLessThan(1.2);
  expect(walker.exhibit).toBe("code-2");

  // Back to the section's list: he steps back from it and waits, working at nothing.
  expect(walker.go("code")).toBe(true);
  finish();
  expect(walker.exhibit).toBeNull();
  expect(walker.focus).toBeNull();
  // A project in another section is ignored as a place to stand in this one.
  walker.go("design", "code-1");
  finish();
  expect(walker.exhibit).toBeNull();
  expect([walker.x, walker.z]).toEqual(NODES[STANDS.design.node]);
  // Away from the exhibits he has nothing to face.
  walker.go("home");
  finish();
  expect(walker.exhibit).toBeNull();
  expect(walker.focus).toBeNull();
});

test("a direct link to a project puts him straight at its exhibit", () => {
  walker.place("events", "events-1");
  expect([walker.x, walker.z]).toEqual(NODES["events-1"]);
  expect(walker.exhibit).toBe("events-1");
});

test("every exhibit's spot is in front of it, within reach, and turned in towards it", () => {
  for (const e of EXHIBITS) {
    const [x, z] = NODES[e.id as keyof typeof NODES];
    expect(z, e.id).toBeGreaterThan(e.z + 0.75);
    expect(Math.hypot(x - e.x, z - e.z), e.id).toBeLessThan(2);
    // On the same level as it, not a step down.
    expect(groundY(x, z), e.id).toBe(heightAt(Math.floor(e.x), Math.floor(e.z)));
    // Facing roughly north (towards the exhibit), turned in by less than a right angle.
    const facing = standAt(e.id).facing;
    expect(Math.cos(facing), e.id).toBeLessThan(-0.3);
    expect(Math.sign(Math.sin(facing)), e.id).toBe(Math.sign(e.x - x));
  }
});
