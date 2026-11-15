import { hash } from "./box";

/** The world is a square grid of columns, HALF blocks out from the centre in each direction. */
export const HALF = 48;

export type Ground = "grass" | "sand" | "path" | "stone" | "snow" | "bed";

export type Plateau = { id: string; x: number; z: number; r: number; h: number; paved?: boolean };

/** Flat places carved into the land for things to stand on. */
export const PLATEAUS: Plateau[] = [
  { id: "lookout", x: 0, z: 23, r: 5.5, h: 7 },
  { id: "plaza", x: 0, z: -7, r: 5, h: 3, paved: true },
  { id: "design", x: -17, z: -8, r: 7, h: 3 },
  { id: "code", x: 17, z: -8, r: 7, h: 3 },
  { id: "play", x: 0, z: -23, r: 8, h: 4 },
  { id: "cottage-a", x: -8, z: -15, r: 4, h: 3 },
  { id: "cottage-b", x: 8, z: -15, r: 4, h: 3 },
  { id: "cottage-c", x: -27, z: -4, r: 4, h: 3 },
  { id: "farm", x: 10, z: 0, r: 4.5, h: 2 },
  { id: "windmill", x: 29, z: -20, r: 3.5, h: 6 },
];

export const plateau = (id: string) => PLATEAUS.find((p) => p.id === id)!;

/** Walking routes between places, as straight runs. */
const PATHS: [number, number, number, number][] = [
  [0, 18, 0, -7],
  [0, -7, -11, -8],
  [0, -7, 11, -8],
  [0, -7, 0, -16],
  [-3, -11, -6, -13],
  [3, -11, 6, -13],
];

const BLEND = 6;

/** The river's z position at a given x. */
export const riverZ = (x: number) => 8 + 3 * Math.sin(x / 9);

function noise(x: number, z: number, seed: number) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hash(x0, z0, seed);
  const bb = hash(x0 + 1, z0, seed);
  const c = hash(x0, z0 + 1, seed);
  const d = hash(x0 + 1, z0 + 1, seed);
  return a + (bb - a) * sx + (c - a) * sz + (a - bb - c + d) * sx * sz;
}

function distToSegment(px: number, pz: number, [x1, z1, x2, z2]: [number, number, number, number]) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (x1 + dx * t), pz - (z1 + dz * t));
}

export const onPath = (x: number, z: number) => PATHS.some((p) => distToSegment(x, z, p) < 1.3);

/** 1 inside the gap in the mountains that faces south (+z), fading to 0 at its sides. */
function southOpening(x: number, z: number) {
  const angle = Math.abs(Math.atan2(x, z));
  const t = Math.min(1, Math.max(0, (0.95 - angle) / 0.45));
  return t * t * (3 - 2 * t);
}

/** How far a point is from the middle of the river. */
export const riverDistance = (x: number, z: number) => Math.abs(z - riverZ(x));

/** Ground height, in whole blocks, at a grid position. 0 means river bed. */
export function heightAt(x: number, z: number): number {
  let h = 2 + 1.5 * noise(x / 13, z / 13, 1) + 0.7 * noise(x / 5, z / 5, 2);

  // A ring of mountains closes the valley in, except to the south, where it opens onto a lake.
  const r = Math.hypot(x, z);
  const south = southOpening(x, z);
  if (r > 31) h += Math.pow(r - 31, 1.3) * 0.5 * (0.55 + 0.9 * noise(x / 9, z / 9, 3)) * (1 - south);
  if (z > 30) h -= south * (z - 30) * 0.9;

  for (const p of PLATEAUS) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < p.r) h = p.h;
    else if (d < p.r + BLEND) {
      const t = (d - p.r) / BLEND;
      const s = t * t * (3 - 2 * t);
      h = p.h + (h - p.h) * s;
    }
  }

  const river = riverDistance(x, z);
  if (river < 2.3) return 0;
  if (river < 4.2) h = Math.min(h, 1 + ((river - 2.3) / 1.9) * 1.4);

  // Anything this low is under water.
  if (h < 0.6) return 0;
  return Math.max(1, Math.round(h));
}

export function groundAt(x: number, z: number): Ground {
  const h = heightAt(x, z);
  if (h === 0) return "bed";
  if (riverDistance(x, z) < 4.2) return "sand";
  if (z > 30 && h <= 2 && southOpening(x, z) > 0.2) return "sand";
  if (onPath(x, z)) return "path";
  if (PLATEAUS.some((p) => p.paved && Math.hypot(x - p.x, z - p.z) < p.r)) return "path";
  if (h >= 15) return "snow";
  if (h >= 9 + Math.round(noise(x / 4, z / 4, 4) * 2)) return "stone";
  return "grass";
}

/** How thick the woods are at a position, from 0 (open) to 1 (dense). */
export const forestAt = (x: number, z: number) => noise(x / 10, z / 10, 5);

/** True where scattered trees and plants must keep clear of a place, path or water. */
export function isReserved(x: number, z: number, margin = 1.5): boolean {
  if (riverDistance(x, z) < 4.6) return true;
  // Keep the slope in front of the lookout open, so nothing stands between it and the camera.
  if (z > 22 && Math.abs(x) < 16) return true;
  if (PATHS.some((p) => distToSegment(x, z, p) < 1.3 + margin)) return true;
  return PLATEAUS.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + margin);
}
