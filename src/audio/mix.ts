import { riverZ } from "../world/voxel/terrain";

/** Where the campfire burns, at the lookout. */
export const CAMPFIRE = { x: 0, z: 24.5 };

/** How loud each background sound is, from 0 to 1. */
export type Ambience = { river: number; fire: number; birds: number; crickets: number };

const fade = (distance: number, reach: number, curve: number) => Math.max(0, 1 - distance / reach) ** curve;

/**
 * The background sounds heard from a point in the valley (usually where the camera is looking),
 * `night` going from 0 by day to 1 by night.
 */
export function ambienceMix(at: { x: number; z: number }, night: number): Ambience {
  const n = Math.min(1, Math.max(0, night));
  return {
    river: fade(Math.abs(at.z - riverZ(at.x)), 22, 1.3),
    fire: fade(Math.hypot(at.x - CAMPFIRE.x, at.z - CAMPFIRE.z), 12, 1.5),
    birds: 0.8 * (1 - n),
    crickets: 0.8 * n,
  };
}
