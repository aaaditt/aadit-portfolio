import { expect, test } from "vitest";
import { ARM_SECONDS, FLIGHT_SECONDS, LAND_SECONDS, MAILBOX, armSwing, planeDown, planeOut } from "./campRule";

test("the signpost's arms start folded and end fully out, quickly", () => {
  expect(armSwing(0)).toBe(0);
  expect(armSwing(ARM_SECONDS)).toBeCloseTo(1);
  expect(armSwing(9)).toBeCloseTo(1);
  expect(Math.max(...[0.1, 0.2, 0.3, 0.4].map((t) => armSwing(t)))).toBeGreaterThan(1);
  expect(ARM_SECONDS).toBeLessThan(1);
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
