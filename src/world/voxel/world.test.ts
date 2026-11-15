import { expect, test } from "vitest";
import { getWorld } from "./world";

test("the world is built once and stays a sensible size", () => {
  const world = getWorld();
  expect(getWorld()).toBe(world);
  const total = world.terrain.length + world.props.length + world.plants.length + world.glow.length;
  // Enough blocks to feel like a place, few enough for an ordinary laptop.
  expect(world.terrain.length).toBeGreaterThan(9000);
  expect(total).toBeLessThan(40000);
});

test("every block has a positive size", () => {
  const world = getWorld();
  for (const list of [world.terrain, world.props, world.plants, world.glow]) {
    for (const [, , , w, h, d] of list) {
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
      expect(d).toBeGreaterThan(0);
    }
  }
});
