/**
 * The camp answers: what the lookout camp does when a visitor asks him something. Plain
 * arithmetic, in the camp's own units from the middle of its ground.
 */

type Point3 = { x: number; y: number; z: number };

// ---- The signpost ----

/** How long the signpost's arms take to swing out. */
export const ARM_SECONDS = 0.5;

/** How far out an arm has swung, `since` seconds after being asked: 0 folded, 1 out, with a little overshoot. */
export function armSwing(since: number): number {
  if (since <= 0) return 0;
  const k = Math.min(1, since / ARM_SECONDS);
  // Back-out easing: a touch past, then settle.
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
}

// ---- The lantern line ----

/** The line runs from the tent's pole to the top of the signpost, sagging in the middle. */
export const LINE = { from: { x: -3.5, y: 3.7, z: -0.3 }, to: { x: 4.55, y: 3.3, z: -0.35 }, sag: 0.55 };

/** A point `k` of the way along the line, 0 at the tent and 1 at the signpost. */
export function linePoint(k: number): Point3 {
  const { from, to, sag } = LINE;
  return {
    x: from.x + (to.x - from.x) * k,
    y: from.y + (to.y - from.y) * k - Math.sin(Math.PI * k) * sag,
    z: from.z + (to.z - from.z) * k,
  };
}

/** Where lantern `i` of `n` hangs: evenly along the line, clear of both ends. */
export const lanternSlot = (i: number, n: number): Point3 => linePoint((i + 1) / (n + 1));

/** Each lantern lights this long after the one before, as the light runs along the line. */
const LIGHT_GAP = 0.3;

/** How long the whole line takes to light. Short: the list in the card never waits for it. */
export const lineLitAfter = (n: number) => (n - 1) * LIGHT_GAP + 0.3;

/**
 * How brightly lantern `i` glows, 0 to 1.
 * - `asked`: the visitor asked about his studies, `since` seconds ago, so the line lights in turn.
 * - `night`: how far into night it is; the line glows softly then, asked or not.
 * - a course still in progress only ever half lights.
 */
export function lanternGlow(i: number, state: "done" | "in progress", now: { asked: boolean; since: number; night: number; still?: boolean }): number {
  const most = state === "done" ? 1 : 0.4;
  const reached = now.asked && (now.still || now.since >= i * LIGHT_GAP);
  return most * Math.max(reached ? 1 : 0, now.night * 0.6);
}

// ---- The paper plane ----

/** The plane is out over the valley for at least this long, however quickly the note is sent: long enough to be seen. */
export const FLIGHT_SECONDS = 1.6;

/** How long the plane takes to come down, into the mailbox or back to his hand. */
export const LAND_SECONDS = 0.9;

/** The mailbox's slot, where a sent note lands. */
export const MAILBOX: Point3 = { x: -4.25, y: 2.35, z: 3.55 };

/** It circles here, over the camp, while the note is being sent. */
const LOOP = { x: 1, y: 5, z: -2.5, radius: 3.2, speed: 2.6 };
/** How long it takes to get from his hand up onto the circle. */
const CLIMB = 0.7;

/** Where the plane is `since` seconds after he threw it from `hand`, and which way it is flying. */
export function planeOut(since: number, hand: Point3): Point3 & { heading: number } {
  const angle = Math.max(0, since) * LOOP.speed;
  const ring = { x: LOOP.x + Math.sin(angle) * LOOP.radius, y: LOOP.y + Math.sin(angle * 2) * 0.5, z: LOOP.z + Math.cos(angle) * LOOP.radius };
  const k = Math.max(0, Math.min(1, since / CLIMB));
  const e = k * k * (3 - 2 * k);
  return {
    x: hand.x + (ring.x - hand.x) * e,
    y: hand.y + (ring.y - hand.y) * e,
    z: hand.z + (ring.z - hand.z) * e,
    // Along the circle once it is on it; straight out from him before that.
    heading: k < 1 ? Math.atan2(ring.x - hand.x, ring.z - hand.z) : angle + Math.PI / 2,
  };
}

/** Where the plane is `since` seconds into coming down from `from` to `to`, in a shallow arc. `landed` once it is there. */
export function planeDown(since: number, from: Point3, to: Point3): Point3 & { heading: number; landed: boolean } {
  const k = Math.max(0, Math.min(1, since / LAND_SECONDS));
  const e = k * k * (3 - 2 * k);
  return {
    x: from.x * (1 - e) + to.x * e,
    y: from.y * (1 - e) + to.y * e + (k < 1 ? Math.sin(Math.PI * k) * 0.8 : 0),
    z: from.z * (1 - e) + to.z * e,
    heading: Math.atan2(to.x - from.x, to.z - from.z),
    landed: k >= 1,
  };
}
