import { expect, test } from "vitest";
import { HALF, PLATEAUS, groundAt, heightAt, isReserved, riverZ } from "./terrain";

test("heights are whole blocks and the same every time", () => {
  for (let x = -HALF; x < HALF; x += 7) {
    for (let z = -HALF; z < HALF; z += 7) {
      const h = heightAt(x, z);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(heightAt(x, z)).toBe(h);
    }
  }
});

test("every place sits on flat ground at its own height", () => {
  for (const p of PLATEAUS) {
    for (const [dx, dz] of [[0, 0], [p.r - 1.5, 0], [0, -(p.r - 1.5)], [-2, 2]]) {
      expect(heightAt(Math.round(p.x + dx), Math.round(p.z + dz)), p.id).toBe(p.h);
    }
  }
});

test("the river is cut down to its bed along its whole length", () => {
  for (let x = -40; x <= 40; x += 5) {
    const z = Math.round(riverZ(x));
    expect(heightAt(x, z)).toBe(0);
    expect(groundAt(x, z)).toBe("bed");
  }
});

test("mountains rise at the edge of the valley", () => {
  expect(heightAt(-46, -40)).toBeGreaterThan(10);
  expect(heightAt(0, -2)).toBeLessThan(6);
});

test("places, paths and the river are kept clear of scattered trees", () => {
  expect(isReserved(0, -7)).toBe(true);
  expect(isReserved(0, 2)).toBe(true);
  expect(isReserved(5, Math.round(riverZ(5)))).toBe(true);
  expect(isReserved(-34, 20)).toBe(false);
});

test("the valley opens onto a lake to the south", () => {
  expect(heightAt(6, 44)).toBe(0);
  expect(groundAt(6, 44)).toBe("bed");
  expect(heightAt(-44, 6)).toBeGreaterThan(8);
});
