/**
 * Open the Hood: a code project's machine, which assembles above its terminal when the project is
 * opened. One block per working part, in a row; a glowing packet runs through them and the last
 * one shows what comes out. Plain arithmetic, in the exhibit's own units from its foot.
 */

/** A block's size, the gap between neighbours' middles, and where the row floats. */
export const PART = { size: 1.15, gap: 1.65, y: 5.1, z: 0.9 };

export type PartPose = { x: number; y: number; z: number; size: number; shown: boolean };

/** A block's place in the row: `i` of `n`, left to right, centred over the terminal. */
export function partSlot(i: number, n: number): PartPose {
  return { x: (i - (n - 1) / 2) * PART.gap, y: PART.y, z: PART.z, size: 1, shown: true };
}

/** Packed away: small, inside the terminal's screen. */
const PACKED: PartPose = { x: 0, y: 1.65, z: 0.1, size: 0.15, shown: false };

const FIRST = 0.25;
const STAGGER = 0.22;

/** How long after opening the whole row is out and settled. */
export const builtAfter = (n: number) => FIRST + (n - 1) * STAGGER + 0.45;

/** How far a picked block lifts out of the row, and how much it grows. */
const LIFT = 0.55;
const GROW = 1.25;

/**
 * Where block `i` of `n` should be heading.
 * - `open`: its project is the one being shown.
 * - `since`: seconds since it was opened.
 * - `picked`: which block has been picked, or -1.
 * - `still`: motion is off, so nothing waits its turn.
 */
export function partTarget(i: number, n: number, now: { open: boolean; since: number; picked: number; still?: boolean }): PartPose {
  if (!now.open) return PACKED;
  if (!now.still && now.since < FIRST + i * STAGGER) return PACKED;
  const slot = partSlot(i, n);
  return now.picked === i ? { ...slot, y: slot.y + LIFT, size: GROW } : slot;
}

/** A run lasts this long: the packet crosses the row, then the result stays lit. */
export const RUN_SECONDS = 2.2;
/** The crossing itself. */
const CROSSING = 1.7;

/**
 * The run, `since` seconds after the lever was pulled.
 * - `x`: where the packet is, starting one gap before the first block.
 * - `on`: the packet is in flight.
 * - `lit`: how many blocks it has reached, counting from the left.
 * - `done`: it has come out of the last block, which now shows the result.
 */
export function runAt(n: number, since: number): { x: number; on: boolean; lit: number; done: boolean } {
  const from = partSlot(0, n).x - PART.gap;
  const to = partSlot(n - 1, n).x;
  if (since < 0) return { x: from, on: false, lit: 0, done: false };
  const k = Math.min(1, since / CROSSING);
  const x = from + (to - from) * k;
  let lit = 0;
  for (let i = 0; i < n; i++) if (partSlot(i, n).x <= x + 1e-9) lit++;
  return { x, on: k < 1, lit, done: k >= 1 };
}
