import { hash } from "./box";

/**
 * What he makes at each exhibit while he works at it, moment by moment. Each kind of work runs in
 * a loop, and his face follows the same loop (see expression.ts): concentrating while it is under
 * way, pleased when it is done.
 */
export const LOOP = {
  /** A painting: strokes go on one by one, then he steps back pleased with it. */
  easel: { seconds: 5, doneAt: 3.6 },
  /** Code: lines are typed, then "aha", it works. */
  terminal: { seconds: 7, doneAt: 5 },
} as const;

export type Kind = keyof typeof LOOP;

/** Where in its loop the moment `t` falls, and which time round the loop it is. */
export function loopAt(kind: Kind, t: number): { p: number; round: number } {
  const { seconds } = LOOP[kind];
  const round = Math.floor(t / seconds);
  return { p: t - round * seconds, round };
}

/** True if the work was finished between the two moments: the cue for a little burst of sparkle. */
export function finishedBetween(kind: Kind, before: number, now: number): boolean {
  if (now <= before) return false;
  const { seconds, doneAt } = LOOP[kind];
  // The most recent finish at or before `now`; it counts if `before` came before it.
  const last = Math.floor((now - doneAt) / seconds) * seconds + doneAt;
  return last > before && last <= now;
}

/** A rectangle on the canvas or screen, in the exhibit's own units, and its colour (0-3). */
export type Mark = { x: number; y: number; w: number; h: number; colour: number };

// ---- Painting ----

/** The canvas, inside its border: x from -0.85 to 0.85 and y from 0.95 to 2.2. */
const CANVAS = { left: -0.85, right: 0.85, bottom: 0.95, top: 2.2 };
const STROKES = 4;
/** When each stroke starts, and how long it takes to go on. */
const STROKE_START = 0.3;
const STROKE_GAP = 0.8;
const STROKE_TIME = 0.6;
/** The painting is cleared away over this last stretch of the loop, ready for the next. */
const CLEAR = 0.4;

/** The strokes on the canvas at moment `t`, each drawn `share` of the way across. */
export function painting(t: number, seed: number): (Mark & { share: number })[] {
  const { p, round } = loopAt("easel", t);
  const fade = Math.max(0, Math.min(1, (LOOP.easel.seconds - p) / CLEAR));
  const out: (Mark & { share: number })[] = [];
  for (let i = 0; i < STROKES; i++) {
    const share = Math.max(0, Math.min(1, (p - STROKE_START - i * STROKE_GAP) / STROKE_TIME)) * fade;
    if (share <= 0) continue;
    const w = 0.4 + hash(round, i, seed) * 0.5;
    const h = 0.28 + hash(round, i + 10, seed) * 0.3;
    out.push({
      x: CANVAS.left + hash(round, i + 20, seed) * (CANVAS.right - CANVAS.left - w),
      y: CANVAS.bottom + hash(round, i + 30, seed) * (CANVAS.top - CANVAS.bottom - h),
      w,
      h,
      colour: (round + i) % 3,
      share,
    });
  }
  return out;
}

// ---- Code ----

/** Rows of text on the screen, bottom first, and the line height. */
export const SCREEN = { rows: 5, left: -0.62, right: 0.62, bottom: 1.28, step: 0.18, height: 0.09 };
const LINES_PER_ROUND = 6;
/** Lines typed a second. */
const TYPING = 1.25;

/** The lines on the screen at moment `t`, bottom row first, and where the cursor is. */
export function code(t: number, seed: number): { lines: Mark[]; cursor: { x: number; y: number }; passed: boolean } {
  const { p, round } = loopAt("terminal", t);
  const typed = Math.min(LINES_PER_ROUND, p * TYPING);
  const count = round * LINES_PER_ROUND + typed;
  const current = Math.floor(count);
  const share = count - current;
  const lines: Mark[] = [];
  let cursor = { x: SCREEN.left, y: SCREEN.bottom };
  for (let row = 0; row < SCREEN.rows; row++) {
    const n = current - row;
    if (n < 0) break;
    const indent = Math.floor(hash(n, 1, seed) * 3) * 0.12;
    const full = 0.25 + hash(n, 2, seed) * (SCREEN.right - SCREEN.left - indent - 0.25);
    const w = row === 0 ? full * share : full;
    const y = SCREEN.bottom + row * SCREEN.step;
    if (row === 0) cursor = { x: SCREEN.left + indent + w, y };
    if (w > 0.005) lines.push({ x: SCREEN.left + indent, y, w, h: SCREEN.height, colour: Math.floor(hash(n, 3, seed) * 4) });
  }
  return { lines, cursor, passed: p >= LOOP.terminal.doneAt };
}
