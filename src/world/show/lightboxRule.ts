/**
 * The Lightbox: a design project's show. Meadow voxels rise in a wave and become one huge, backlit
 * sheet; dragging sideways pulls it apart into its stages, like cards spread from a deck. All plain
 * arithmetic, so it can be tested without the scene. Lengths are in world units, from the sheet's
 * middle; turns are in radians.
 */

/** His height, standing, feet to hair (his body runs below his model's origin; see Character). */
export const HIS_HEIGHT = 3.5;

/** The hero sheet: three times his height, and the voxel grid it is built from. */
export const HERO = { w: 14.3, h: 10.6, cols: 10, rows: 6 };

/**
 * Where the sheet's middle stands, from the easel's foot: just behind the easel, its bottom edge a
 * little off the grass, so he and the easel stand in front of it, dark against its light.
 */
export const SHEET_AT = { x: 0.3, y: 0.5 + HERO.h / 2, z: -1.4 };

/** Where cell `i` of the grid sits on the sheet, counting from the bottom left, row by row. */
export function cellAt(i: number, cols: number, rows: number): { x: number; y: number } {
  const col = i % cols;
  const row = Math.floor(i / cols);
  return { x: -HERO.w / 2 + ((col + 0.5) * HERO.w) / cols, y: -HERO.h / 2 + ((row + 0.5) * HERO.h) / rows };
}

/** The order the cells rise in: a wave outwards from the foot of the sheet's middle, nearest first. */
export function waveOrder(cols: number, rows: number): number[] {
  const all = Array.from({ length: cols * rows }, (_, i) => i);
  const reach = (i: number) => {
    const c = cellAt(i, cols, rows);
    return Math.hypot(c.x, c.y + HERO.h / 2);
  };
  return all.sort((a, b) => reach(a) - reach(b) || a - b);
}

/**
 * The rise: a short beat first, so the eye finds the easel; then each voxel sets off this long
 * after the one before, and takes this long to arrive.
 */
const RISE_DELAY = 0.2;
const RISE_GAP = 0.008;
const RISE_EACH = 0.3;
/** Every voxel is in by now. */
export const RISE_SECONDS = RISE_DELAY + RISE_GAP * (HERO.cols * HERO.rows - 1) + RISE_EACH;

/** Overshoots a little past 1 before settling on it: about 1.1 at its height. */
const backOut = (k: number) => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);

/**
 * How the `i`-th voxel to set off is doing, `since` seconds after the show began: how far along its
 * path (`p`, 0 to 1, eased), and how big against its cell (`grow`: it lands a touch large and settles).
 */
export function riseAt(i: number, since: number, still = false): { p: number; grow: number; done: boolean } {
  if (still) return { p: 1, grow: 1, done: true };
  const k = Math.min(1, Math.max(0, (since - RISE_DELAY - i * RISE_GAP) / RISE_EACH));
  if (k >= 1) return { p: 1, grow: 1, done: true };
  // Fast off the ground, slowing as it lands in place.
  return { p: 1 - Math.pow(1 - k, 3), grow: backOut(k), done: false };
}

/** Where a stage's plane is drawn: offset from the sheet's middle, turned about its upright, and sized. */
export type PlanePose = { x: number; y: number; z: number; turn: number; size: number };

/**
 * Pulled apart, the planes stand in one row in stage order, overlapping like a hand of cards: each
 * a little in front of the one on its left, so every name tab (top left) shows. Distances are in
 * sheet widths, sizes in sheets. The one under the scrub comes forward and larger, and is drawn
 * down out of the hand, so its top edge sits below its neighbours' name tabs and never hides them.
 */
const APART = { gap: 0.25, size: 0.46, turn: 0.25, step: 0.3, forward: 1.9, grow: 0.3, drop: 1.6 };
/**
 * Stacked, the planes behind peek out down the right and along the bottom, like a pad of paper.
 * Their name tabs stay hidden behind the top one's.
 */
const STACK = { gap: 0.24, drop: 0.16, depth: 0.12, shrink: 0.02 };

/**
 * Where plane `i` of `n` is, with the scrub at `s` (a stage, or between two) and the planes
 * `spread` apart: 0 a neat stack with stage `s` on top, 1 a row with stage `s` picked out.
 * `fan.shift` moves the row sideways (world units), to keep it clear of a card down the screen's
 * left; `fan.scale` makes the row larger, where the screen has room for it.
 */
export function planeAt(i: number, n: number, s: number, spread: number, fan: { shift?: number; scale?: number } = {}): PlanePose {
  const { shift = 0, scale = 1 } = fan;
  const d = i - s;
  const near = 1 - Math.min(1, Math.abs(d));
  const middle = (n - 1) / 2;
  const across = middle > 0 ? (i - middle) / middle : 0;
  const stacked = { x: Math.abs(d) * STACK.gap, y: -Math.abs(d) * STACK.drop, z: -Math.abs(d) * STACK.depth, size: 1 - Math.min(3, Math.abs(d)) * STACK.shrink };
  const fanned = {
    x: (i - middle) * APART.gap * HERO.w * scale + shift,
    // Only the plane under the scrub comes forward, so a neighbour half under it never covers
    // the name tab of the plane beyond.
    z: (i - middle) * APART.step + smooth(0.4, 0.6, near) * APART.forward,
    size: APART.size * scale * (1 + APART.grow * near),
  };
  const k = Math.min(1, Math.max(0, spread));
  const mix = (a: number, b: number) => a + (b - a) * k;
  return {
    x: mix(stacked.x, fanned.x),
    // (+ 0 turns a minus zero at rest into a plain zero.)
    y: mix(stacked.y, -near * APART.drop) + 0,
    z: mix(stacked.z, fanned.z),
    // Plain zero when square on, not minus zero.
    turn: k === 0 || across === 0 ? 0 : -k * across * APART.turn,
    size: mix(stacked.size, fanned.size),
  };
}

/** A smooth 0 to 1 between two points. */
function smooth(a: number, b: number, x: number) {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

/** The stage a scrub position settles on: the nearest, never past either end. */
export function snapTo(s: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.round(s)));
}

/** Letting go: a squash this long, wide and low, then a little overshoot back. */
const SQUASH_SECONDS = 0.2;

/** The settled sheet's stretch across and up, `since` seconds after letting go. */
export function squashAt(since: number, still = false): { x: number; y: number } {
  if (still || since < 0 || since >= SQUASH_SECONDS) return { x: 1, y: 1 };
  const u = since / SQUASH_SECONDS;
  const k = Math.sin(2 * Math.PI * u) * (1 - u);
  return { x: 1 + 0.1 * k, y: 1 - 0.1 * k };
}

/**
 * The peel hint, this many seconds after the sheet is whole: the top plane lifts at its right edge,
 * holds there long enough to be seen, and settles. If nobody has touched it, it peels once more
 * this long after.
 */
const PEEK_AT = 0.3;
const PEEK_UP = 0.15;
const PEEK_HOLD = 0.35;
export const PEEK_AGAIN = 2.2;
export const PEEK_MAX = (15 * Math.PI) / 180;
/** At the peel's height, the top plane has slid this far right. */
export const PEEK_SLIDE = 2.1;

/**
 * How far the top plane is peeled back, in radians, `since` seconds after the sheet is whole. The
 * plane also slides aside in step (see PEEK_SLIDE), so the stage under it shows.
 */
export function peekAt(since: number): number {
  const u = since - PEEK_AT;
  if (u <= 0) return 0;
  if (u < PEEK_UP) return PEEK_MAX * Math.sin((Math.PI / 2) * (u / PEEK_UP));
  if (u < PEEK_UP + PEEK_HOLD) return PEEK_MAX;
  const back = u - PEEK_UP - PEEK_HOLD;
  const swing = PEEK_MAX * Math.exp(-back * 4.5) * Math.cos(back * 6);
  return Math.abs(swing) < 0.003 ? 0 : swing;
}

/** With no touch for this long, the sheet scrubs once on its own, out and back, over this long. */
export const IDLE_SECONDS = 4;
const AUTO_SECONDS = 1.8;

/**
 * The one scrub it makes on its own, `since` seconds after the sheet is whole (or last touched):
 * how far the scrub point is moved back towards earlier stages, and how far the planes spread.
 */
export function autoScrub(since: number): { offset: number; spread: number } {
  const u = since - IDLE_SECONDS;
  if (u <= 0 || u >= AUTO_SECONDS) return { offset: 0, spread: 0 };
  const k = Math.sin((Math.PI * u) / AUTO_SECONDS);
  return { offset: -0.7 * k, spread: Math.min(1, k * 1.15) };
}
