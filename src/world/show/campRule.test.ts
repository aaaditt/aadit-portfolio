import { expect, test } from "vitest";
import { ARM_SECONDS, FLIGHT_SECONDS, LAND_SECONDS, LINE, MAILBOX, armSwing, lanternGlow, lanternSlot, lineLitAfter, planeDown, planeOut } from "./campRule";

test("the signpost's arms start folded and end fully out, quickly", () => {
  expect(armSwing(0)).toBe(0);
  expect(armSwing(ARM_SECONDS)).toBeCloseTo(1);
  expect(armSwing(9)).toBeCloseTo(1);
  expect(Math.max(...[0.1, 0.2, 0.3, 0.4].map((t) => armSwing(t)))).toBeGreaterThan(1);
  expect(ARM_SECONDS).toBeLessThan(1);
});

test("the lanterns hang evenly between the tent and the signpost, below the ends of the line", () => {
  const slots = [0, 1, 2, 3].map((i) => lanternSlot(i, 4));
  for (let i = 1; i < 4; i++) expect(slots[i].x - slots[i - 1].x).toBeCloseTo(slots[1].x - slots[0].x);
  expect(slots[0].x).toBeGreaterThan(LINE.from.x);
  expect(slots[3].x).toBeLessThan(LINE.to.x);
  for (const s of slots) expect(s.y).toBeLessThan(Math.max(LINE.from.y, LINE.to.y));
});

test("asked about his studies, the line lights one lantern after another, soon enough", () => {
  const now = { asked: true, night: 0 };
  expect(lanternGlow(0, "done", { ...now, since: 0 })).toBe(1);
  expect(lanternGlow(3, "done", { ...now, since: 0 })).toBe(0);
  expect(lanternGlow(3, "done", { ...now, since: lineLitAfter(4) })).toBe(1);
  expect(lineLitAfter(8)).toBeLessThan(3);
  expect(lanternGlow(3, "done", { ...now, since: 0, still: true })).toBe(1);
});

test("a course still in progress never fully lights; at night the line glows softly, asked or not", () => {
  expect(lanternGlow(0, "in progress", { asked: true, since: 9, night: 0 })).toBeLessThan(0.5);
  expect(lanternGlow(0, "in progress", { asked: true, since: 9, night: 0 })).toBeGreaterThan(0);
  expect(lanternGlow(0, "done", { asked: false, since: 0, night: 0 })).toBe(0);
  const atNight = lanternGlow(0, "done", { asked: false, since: 0, night: 1 });
  expect(atNight).toBeGreaterThan(0);
  expect(atNight).toBeLessThan(1);
});

test("the plane leaves from his hand, and comes down exactly where it is sent", () => {
  const hand = { x: 1, y: 2.5, z: 4 };
  expect(planeOut(0, hand)).toMatchObject(hand);
  const far = planeOut(3, hand);
  expect(Math.hypot(far.x - hand.x, far.z - hand.z)).toBeGreaterThan(3);
  const from = { x: 2, y: 5, z: -6 };
  expect(planeDown(0, from, MAILBOX)).toMatchObject({ ...from, landed: false });
  expect(planeDown(LAND_SECONDS, from, MAILBOX)).toMatchObject({ ...MAILBOX, landed: true });
  expect(planeDown(LAND_SECONDS, from, hand)).toMatchObject({ ...hand, landed: true });
  expect(LAND_SECONDS).toBeLessThan(1.5);
});

test("however fast a note is sent, its plane is out long enough to be seen, and the whole flight stays short", () => {
  expect(FLIGHT_SECONDS).toBeGreaterThan(1);
  expect(FLIGHT_SECONDS + LAND_SECONDS).toBeLessThan(3);
});
