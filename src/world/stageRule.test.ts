import { expect, test } from "vitest";
import { ENTER_SECONDS, EXIT_SECONDS, GRADES, NARROW, fogRange, keyLevel, stageStepBack, lightScale, stageFov, stageStep, viewDrop, dimRadius } from "./stageRule";

test("the stage comes up over 0.9 s and goes down over 0.6 s, and never past either end", () => {
  let level = 0;
  for (let t = 0; t < ENTER_SECONDS - 0.05; t += 0.05) level = stageStep(level, true, 0.05, true);
  expect(level).toBeLessThan(1);
  level = stageStep(level, true, 0.1, true);
  expect(level).toBe(1);
  expect(stageStep(1, true, 1, true)).toBe(1);
  let down = 1;
  for (let t = 0; t < EXIT_SECONDS - 0.05; t += 0.05) down = stageStep(down, false, 0.05, true);
  expect(down).toBeGreaterThan(0);
  expect(stageStep(down, false, 0.1, true)).toBe(0);
  expect(EXIT_SECONDS).toBeLessThan(ENTER_SECONDS);
});

test("with motion reduced, the stage is simply on or off", () => {
  expect(stageStep(0, true, 0.016, false)).toBe(1);
  expect(stageStep(1, false, 0.016, false)).toBe(0);
});

test("the key light comes on only over the last part of the way in: that is the moment the world changes", () => {
  expect(keyLevel(0)).toBe(0);
  expect(keyLevel(0.5)).toBe(0);
  expect(keyLevel(0.8)).toBeGreaterThan(0);
  expect(keyLevel(0.8)).toBeLessThan(1);
  expect(keyLevel(1)).toBe(1);
});

test("the world's own light drops to four tenths by day, and a little less far by night", () => {
  expect(lightScale(0, 0)).toBe(1);
  expect(lightScale(1, 0)).toBeCloseTo(0.4);
  expect(lightScale(1, 1)).toBeCloseTo(0.55 / 0.85);
  expect(lightScale(0.5, 0)).toBeCloseTo(0.7);
});

test("the fog closes in around the show, wherever the camera stands", () => {
  expect(fogRange(20, 0)).toEqual({ near: 45, far: 150 });
  expect(fogRange(20, 1)).toEqual({ near: 16, far: 60 });
  // The show itself is always inside the clear part.
  for (const d of [8, 15, 30]) expect(fogRange(d, 1).near).toBeLessThan(d);
});

test("the camera steps back as the lens narrows, so the show grows but keeps room round it", () => {
  expect(stageStepBack(0)).toBe(1);
  const lens = Math.tan((35 / 2) * (Math.PI / 180)) / Math.tan((22 / 2) * (Math.PI / 180));
  const growth = lens / stageStepBack(1);
  expect(growth).toBeGreaterThan(1.1);
  expect(growth).toBeLessThan(1.4);
});

test("the dimming closes in from 14 to 6 around the show", () => {
  expect(dimRadius(0)).toBe(14);
  expect(dimRadius(1)).toBe(6);
});

test("the lens narrows on a staged show, a little less on a phone", () => {
  expect(stageFov(0, 1360)).toBe(35);
  expect(stageFov(1, 1360)).toBe(NARROW.desktop);
  expect(stageFov(1, 390)).toBe(NARROW.phone);
  expect(NARROW.desktop).toBeLessThan(NARROW.phone);
});

test("the show sits a little above the middle on a desktop, and high up on a phone, clear of the sheet", () => {
  // As a share of the screen's height, how far the picture is moved down so the show rises.
  expect(viewDrop(1, 1360)).toBeCloseTo(0.05);
  expect(viewDrop(1, 390)).toBeCloseTo(0.26);
  expect(viewDrop(0, 390)).toBeCloseTo(0.2);
  expect(viewDrop(0, 1360)).toBe(0);
});

test("every place has its own fog by day and by night, and a key light", () => {
  for (const place of ["design", "code", "events", "about"] as const) {
    const g = GRADES[place];
    for (const c of [g.day, g.night, g.key]) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
  }
});
