/**
 * The Stage: when an item is opened, the world goes dark around one lit show. Everything here is
 * plain arithmetic about how far that has gone, so it can be tested without the scene.
 * `level` runs from 0 (the ordinary world) to 1 (fully staged).
 */

export type StagePlace = "design" | "code" | "events" | "about";

/** Each place's fog, by day and by night, and the colour of the light on its show. */
export const GRADES: Record<StagePlace, { day: string; night: string; key: string }> = {
  design: { day: "#7d9a94", night: "#1d3a3c", key: "#fff4dc" },
  code: { day: "#6c7f96", night: "#0f1a2e", key: "#8fe3ff" },
  events: { day: "#c49a64", night: "#3a2414", key: "#ffe2b0" },
  about: { day: "#c99a6a", night: "#1b2440", key: "#ffa24a" },
};

/** How long the stage takes to come up, and to go down again. */
export const ENTER_SECONDS = 0.9;
export const EXIT_SECONDS = 0.6;

/** Moves the stage on by a frame, towards on or off. With motion reduced it simply is. */
export function stageStep(level: number, on: boolean, delta: number, animate: boolean): number {
  if (!animate) return on ? 1 : 0;
  const next = on ? level + delta / ENTER_SECONDS : level - delta / EXIT_SECONDS;
  return Math.min(1, Math.max(0, next));
}

/** A smooth 0 to 1 between two points. */
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** How brightly the key light shines: it comes on over the last part of the way in. */
export const keyLevel = (level: number) => smooth(0.55, 1, level);

/** How much of its own light the world keeps: four tenths by day; by night, 0.55 out of 0.85. */
export function lightScale(level: number, night: number): number {
  const most = 0.4 + (0.55 / 0.85 - 0.4) * night;
  return 1 + (most - 1) * level;
}

/** The fog's ordinary range. Keep in step with DayNight. */
const FOG = { near: 45, far: 150 };

/** Where the fog starts and ends, `distance` being how far the camera is from the show. */
export function fogRange(distance: number, level: number): { near: number; far: number } {
  return {
    near: FOG.near + (distance - 4 - FOG.near) * level,
    far: FOG.far + (distance + 40 - FOG.far) * level,
  };
}

/** Beyond this distance from the show, the world is dimmed. */
export const dimRadius = (level: number) => 14 - 8 * level;

/** The narrow lens of a staged show. A phone keeps a little more round it. */
export const NARROW = { desktop: 22, phone: 26 };
/** Screens this narrow or narrower have the card along the bottom. Keep in step with CameraRig. */
const PHONE = 560;

/**
 * How much further back the camera stands as the lens narrows. The lens alone would make the show
 * 1.6 times bigger; stepping back by this much leaves it about 1.2 times bigger, with room round it.
 */
export const stageStepBack = (level: number) => 1 + 0.35 * level;

/**
 * Per place, how the staged camera frames its show:
 * - `back`: how much further back it stands;
 * - `rise`: how much of its height above the show it keeps;
 * - `side`: how far it moves to the right (world units);
 * - `phone`: how much closer it comes on a tall screen, where the card sits below and the show can be larger.
 * The Lightbox's sheet is three times his height, so the camera stands well back, comes down low
 * and steps right, past the tree in front of the easels, to look over his shoulder at it.
 */
export const SHOW_FRAME: Record<StagePlace, { back: number; rise: number; side: number; phone: number }> = {
  design: { back: 2.15, rise: 0.35, side: 2, phone: 0.85 },
  code: { back: 1, rise: 1, side: 0, phone: 1 },
  events: { back: 1, rise: 1, side: 0, phone: 1 },
  about: { back: 1, rise: 1, side: 0, phone: 1 },
};

/** The lens, from the ordinary 35 to the stage's narrow one. */
export function stageFov(level: number, width: number): number {
  const narrow = width <= PHONE ? NARROW.phone : NARROW.desktop;
  return 35 + (narrow - 35) * level;
}

/**
 * How far the picture is moved down, as a share of the screen's height, which lifts what the
 * camera looks at. Staged, a desktop show sits at 45% down and a phone's at 24%, above the sheet.
 * Unstaged, a phone keeps its usual lift and a desktop none.
 */
export function viewDrop(level: number, width: number): number {
  const phone = width <= PHONE;
  const plain = phone ? 0.2 : 0;
  const staged = phone ? 0.26 : 0.05;
  return plain + (staged - plain) * level;
}
