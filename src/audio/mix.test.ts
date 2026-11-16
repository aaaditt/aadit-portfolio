import { expect, test } from "vitest";
import { riverZ } from "../world/voxel/terrain";
import { CAMPFIRE, ambienceMix } from "./mix";

test("the river is loud beside it and silent across the valley", () => {
  expect(ambienceMix({ x: 0, z: riverZ(0) }, 0).river).toBeGreaterThan(0.9);
  expect(ambienceMix({ x: 0, z: -24 }, 0).river).toBe(0);
});

test("the campfire crackles only near the lookout", () => {
  expect(ambienceMix({ x: CAMPFIRE.x, z: CAMPFIRE.z + 1 }, 0).fire).toBeGreaterThan(0.7);
  expect(ambienceMix({ x: 17, z: -8 }, 0).fire).toBe(0);
});

test("birds sing by day, crickets by night, and they cross over at dusk", () => {
  const day = ambienceMix({ x: 0, z: 0 }, 0);
  const night = ambienceMix({ x: 0, z: 0 }, 1);
  const dusk = ambienceMix({ x: 0, z: 0 }, 0.5);
  expect(day.birds).toBeGreaterThan(0.5);
  expect(day.crickets).toBe(0);
  expect(night.birds).toBe(0);
  expect(night.crickets).toBeGreaterThan(0.5);
  expect(dusk.birds).toBeGreaterThan(0);
  expect(dusk.crickets).toBeGreaterThan(0);
});

test("every level stays between 0 and 1", () => {
  for (let x = -40; x <= 40; x += 8) {
    for (let z = -40; z <= 40; z += 8) {
      for (const level of Object.values(ambienceMix({ x, z }, 0.3))) {
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      }
    }
  }
});
