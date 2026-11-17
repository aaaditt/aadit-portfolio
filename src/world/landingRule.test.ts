import { expect, test } from "vitest";
import { BARS_OPEN_AT, driftWeight, handover } from "./landingRule";

test("the flight hands over to the resting view over its last stretch, arriving exactly and gently", () => {
  expect(handover(0.5)).toBe(0);
  expect(handover(0.72)).toBe(0);
  expect(handover(1)).toBe(1);
  // It slows right down as it arrives: the last step is far smaller than one in the middle.
  const last = handover(1) - handover(0.99);
  const middle = handover(0.87) - handover(0.86);
  expect(last).toBeLessThan(middle / 5);
});

test("after landing, following the pointer comes in slowly, so nothing jumps when the flight ends", () => {
  expect(driftWeight(0)).toBe(0);
  // It holds still for over a second first, so the drift reads as life, not as part of the landing.
  expect(driftWeight(1.1)).toBe(0);
  expect(driftWeight(2.5)).toBeGreaterThan(0);
  expect(driftWeight(2.5)).toBeLessThan(1);
  expect(driftWeight(4)).toBe(1);
  // Never a sudden step from one frame to the next.
  for (let s = 0; s < 4; s += 1 / 60) expect(driftWeight(s + 1 / 60) - driftWeight(s)).toBeLessThan(0.02);
});

test("the cinema bars start opening just before the flight lands, so the reveal overlaps the slow-down", () => {
  // The flight lasts 9 s: open about a second before the end, so the 0.9 s opening finishes as it lands.
  const before = (1 - BARS_OPEN_AT) * 9;
  expect(before).toBeGreaterThan(0.9);
  expect(before).toBeLessThan(1.2);
});
