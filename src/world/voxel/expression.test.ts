import { expect, test } from "vitest";
import { blinking, faceFor, type Mood } from "./expression";

const base: Mood = { place: "home", running: false, waving: false, sinceLanding: 99, t: 10, pointerX: 0, animate: true };

test("he blinks now and then, and only for a moment", () => {
  let shut = 0;
  let blinks = 0;
  let was = false;
  for (let t = 0; t < 60; t += 0.01) {
    const now = blinking(t);
    if (now) shut += 0.01;
    if (now && !was) blinks++;
    was = now;
  }
  // Somewhere between once every six seconds and once every two.
  expect(blinks).toBeGreaterThanOrEqual(10);
  expect(blinks).toBeLessThanOrEqual(30);
  // Eyes are shut for well under a tenth of the time.
  expect(shut / 60).toBeLessThan(0.08);
});

test("standing at the lookout he smiles with his eyes open and follows the pointer", () => {
  const right = faceFor({ ...base, t: 0.5, pointerX: 1 });
  const left = faceFor({ ...base, t: 0.5, pointerX: -1 });
  expect(right.mouth).toBe("smile");
  expect(right.eyes).toBe("open");
  expect(right.look).toBeGreaterThan(0);
  expect(left.look).toBeLessThan(0);
});

test("waving, he beams: happy eyes, open grin, rosy cheeks", () => {
  expect(faceFor({ ...base, waving: true })).toMatchObject({ eyes: "happy", mouth: "grin", blush: true });
});

test("just after arriving he grins, and while running he puffs", () => {
  expect(faceFor({ ...base, place: "code", sinceLanding: 0.2 }).mouth).toBe("grin");
  expect(faceFor({ ...base, running: true }).mouth).toBe("o");
});

test("each place has its own look", () => {
  const over = (place: Mood["place"]) => {
    const seen = new Set<string>();
    for (let t = 0; t < 30; t += 0.05) {
      const f = faceFor({ ...base, place, t });
      seen.add(`${f.eyes}/${f.mouth}`);
    }
    return seen;
  };
  // Painting: concentrating, then pleased with the stroke.
  expect(over("design")).toContain("open/flat");
  expect(over("design")).toContain("happy/smile");
  // Coding: steady, with an occasional "aha".
  expect(over("code")).toContain("open/flat");
  expect(over("code")).toContain("open/o");
  // Playing: grinning.
  expect([...over("play")].some((f) => f.endsWith("/grin"))).toBe(true);
});

test("with motion reduced, the face holds still: no blinking, a plain smile", () => {
  for (let t = 0; t < 20; t += 0.01) {
    const f = faceFor({ ...base, t, animate: false });
    expect(f.eyes).toBe("open");
    expect(f.mouth).toBe("smile");
  }
});
