/**
 * The Grounds: an event's cart unpacks into a small fair when the event is opened. Stalls pop up
 * either side, a crowd walks in, and a counter runs up to the number who really came. Plain
 * arithmetic, in the cart's own units: x to its right, z out in front of it (south).
 */

/** The most people ever drawn. A big event fills the ground; it does not draw everyone. */
export const CROWD_MAX = 40;

/** How many people stand for an event's attendance: about one for every four, within limits. */
export const crowdSize = (attendance: number) => Math.max(6, Math.min(CROWD_MAX, Math.round(attendance / 4)));

/** The crowd stands in arcs in front of the cart, the nearest a little way off so he has room. */
const RING = { first: 3.3, step: 0.95, people: 8, more: 3, spread: (56 * Math.PI) / 180 };

/** Where person `i` stands. */
export function crowdSpot(i: number): { x: number; z: number } {
  let ring = 0;
  let left = i;
  while (left >= RING.people + RING.more * ring) {
    left -= RING.people + RING.more * ring;
    ring++;
  }
  const count = RING.people + RING.more * ring;
  const radius = RING.first + RING.step * ring;
  const angle = -RING.spread + ((left + 0.5) / count) * RING.spread * 2;
  return { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius };
}

/** Each person sets off this long after the last, and takes this long to walk in. */
const SET_OFF = 0.035;
const WALK = 0.9;
/** They come from this far out in front. */
const FROM = 6;

/** How long until the whole crowd is in. */
export const crowdInAfter = (count: number) => (count - 1) * SET_OFF + WALK;

/**
 * Where person `i` is and how big, `since` seconds after the event was opened. Before their turn
 * they are not there (size 0); with motion off they are simply in place.
 */
export function crowdAt(i: number, now: { open: boolean; since: number; still?: boolean }): { x: number; z: number; size: number; arrived: boolean } {
  const spot = crowdSpot(i);
  if (!now.open) return { ...spot, size: 0, arrived: false };
  if (now.still) return { ...spot, size: 1, arrived: true };
  const k = Math.max(0, Math.min(1, (now.since - i * SET_OFF) / WALK + 1e-9));
  // Quick at first, slowing into place.
  const e = 1 - (1 - k) * (1 - k);
  return { x: spot.x, z: spot.z + (1 - e) * FROM, size: Math.min(1, k * 5), arrived: k >= 1 };
}

/** The counter runs up over this long. */
export const COUNT_SECONDS = 1.8;

/** What the counter reads `since` seconds after opening: up from zero to the real number, never past it. */
export function countAt(attendance: number, since: number): number {
  const k = Math.max(0, Math.min(1, since / COUNT_SECONDS));
  return Math.round(attendance * (1 - Math.pow(1 - k, 3)));
}

/** The stalls either side of the cart: where each stands, and when it pops up. */
export const STALLS = [
  { x: -2.15, z: -0.2, after: 0.15 },
  { x: 2.15, z: -0.2, after: 0.4 },
];

/** How bright stage light `i` of `n` is at moment `t`: a chase while an event is on, steady otherwise. */
export function stageLight(i: number, n: number, t: number, chasing: boolean): number {
  if (!chasing) return 0.55;
  const lead = Math.floor(t * 7) % n;
  return i === lead ? 1 : i === (lead + n - 1) % n ? 0.6 : 0.2;
}
