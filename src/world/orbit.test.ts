import { beforeEach, expect, test } from "vitest";
import { LIMITS, orbit, orbited, resetOrbit, turnBy, wasDrag, zoomBy } from "./orbit";

const flat = () => 0;
const dist = (a: number[], c: number[]) => Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);

beforeEach(() => resetOrbit());

test("untouched, the view is exactly the section's own", () => {
  expect(orbited([9, 14.5, 50], [0, 9.5, 10], flat)).toEqual([9, 14.5, 50]);
});

test("half a turn puts the camera on the far side, at the same height", () => {
  turnBy(Math.PI, 0);
  const [x, y, z] = orbited([0, 15, 10], [0, 0, 0], flat);
  expect(x).toBeCloseTo(0, 5);
  expect(y).toBeCloseTo(15, 5);
  expect(z).toBeCloseTo(-10, 5);
});

test("turning and tilting keep the distance; zooming scales it", () => {
  const position: [number, number, number] = [-17, 16, 15];
  const target: [number, number, number] = [-18, 5, -8];
  const before = dist(position, target);
  turnBy(1.1, 0.2);
  expect(dist(orbited(position, target, flat), target)).toBeCloseTo(before, 5);
  zoomBy(0.8);
  expect(dist(orbited(position, target, flat), target)).toBeCloseTo(before * 0.8, 5);
});

test("tilt and zoom stop at their limits", () => {
  turnBy(0, 9);
  expect(orbit.pitch).toBe(LIMITS.pitchUp);
  turnBy(0, -9);
  expect(orbit.pitch).toBe(LIMITS.pitchDown);
  zoomBy(100);
  expect(orbit.zoom).toBe(LIMITS.zoomOut);
  zoomBy(0.0001);
  expect(orbit.zoom).toBe(LIMITS.zoomIn);
});

test("the camera is never let below the ground", () => {
  turnBy(0, LIMITS.pitchDown);
  const [, y] = orbited([0, 3, 20], [0, 2, 0], () => 12);
  expect(y).toBe(12 + LIMITS.minHeight);
});

test("swung round into the mountains, the camera draws in to stay over the valley", () => {
  // A valley 20 blocks across, with mountains beyond.
  const valley = (x: number, z: number) => (Math.hypot(x, z) > 20 ? 25 : 2);
  turnBy(Math.PI, 0);
  const [x, , z] = orbited([0, 12, 40], [0, 4, 0], valley);
  expect(Math.hypot(x, z)).toBeLessThanOrEqual(20);
  expect(z).toBeLessThan(0);
});

test("a low, wide view rises as it is swung round; a close-up stays where it is", () => {
  turnBy(1.5, 0);
  const [, wide] = orbited([9, 14.5, 50], [0, 9.5, 10], flat);
  expect(wide).toBeGreaterThan(22);
  const [, near] = orbited([6.2, 8.6, 35.6], [0.8, 9.4, 27.3], () => 6);
  expect(near).toBeCloseTo(8.6, 5);
});

test("turning is remembered until reset", () => {
  expect(orbit.turned).toBe(false);
  turnBy(0.1, 0);
  expect(orbit.turned).toBe(true);
  resetOrbit();
  expect(orbit).toMatchObject({ yaw: 0, pitch: 0, zoom: 1, turned: false });
});

test("a small wobble of the pointer is a click, a real pull is a drag", () => {
  orbit.moved = 3;
  expect(wasDrag()).toBe(false);
  orbit.moved = 10;
  expect(wasDrag()).toBe(true);
});
