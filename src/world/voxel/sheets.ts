/**
 * The Light Table: a design project's working sheets, which rise off its easel and fan out above
 * it like a hand of cards when the project is opened. Everything here is plain arithmetic, so it
 * can be tested without the 3D scene. Positions are in the exhibit's own units, from its foot.
 */

/** The stages of a piece of design work that a sheet can show. */
export const SHEET_KINDS = ["sketch", "wireframe", "palette", "final"] as const;
export type SheetKind = (typeof SHEET_KINDS)[number];

/** A sheet's size in the fan. */
export const SHEET = { w: 1.5, h: 1.1 };

/** The colour of each kind of paper. */
export const PAPER: Record<SheetKind, string> = {
  sketch: "#f3ead2",
  wireframe: "#ffffff",
  palette: "#fbf7ee",
  final: "#ffffff",
};

/** A flat patch of colour on a sheet. The sheet runs from 0 to 1 each way, from its bottom left. */
export type Patch = { x: number; y: number; w: number; h: number; colour: string };

const PENCIL = "#55606e";
const GREY = "#b8bcc4";
const PALE = "#dfe2e7";

/** The four edges of a box, as thin lines. */
function outline(x: number, y: number, w: number, h: number, line: number, colour: string): Patch[] {
  return [
    { x, y, w, h: line, colour },
    { x, y: y + h - line, w, h: line, colour },
    { x, y, w: line, h, colour },
    { x: x + w - line, y, w: line, h, colour },
  ];
}

/** How a project's pictures are laid out: the same four shapes at every stage. */
export type SheetLayout = "blocks" | "screen" | "poster";

type Rect = { x: number; y: number; w: number; h: number };

const LAYOUTS: Record<SheetLayout, Rect[]> = {
  // An identity: two blocks along the bottom, two above.
  blocks: [
    { x: 0.105, y: 0.138, w: 0.368, h: 0.379 },
    { x: 0.474, y: 0.138, w: 0.447, h: 0.241 },
    { x: 0.553, y: 0.483, w: 0.289, h: 0.379 },
    { x: 0.132, y: 0.586, w: 0.263, h: 0.276 },
  ],
  // An app screen: a bar across the top, a side panel, a card and a button.
  screen: [
    { x: 0.1, y: 0.7, w: 0.8, h: 0.14 },
    { x: 0.1, y: 0.14, w: 0.24, h: 0.5 },
    { x: 0.4, y: 0.34, w: 0.5, h: 0.3 },
    { x: 0.62, y: 0.14, w: 0.28, h: 0.14 },
  ],
  // A poster: one big shape, a band of type under it, and two smaller marks beside it.
  poster: [
    { x: 0.1, y: 0.36, w: 0.44, h: 0.5 },
    { x: 0.1, y: 0.14, w: 0.8, h: 0.15 },
    { x: 0.6, y: 0.58, w: 0.3, h: 0.28 },
    { x: 0.6, y: 0.36, w: 0.18, h: 0.15 },
  ],
};

/**
 * The picture on a sheet. Until a project has real images, each stage is drawn from its colours:
 * - the sketch is pencil outlines of where things will go;
 * - the wireframe is the same layout as grey boxes;
 * - the palette is the project's three colours as swatches;
 * - the final piece is the layout in those colours.
 */
export function sheetArt(kind: SheetKind, [a, b, c]: [string, string, string], layout: SheetLayout = "blocks"): Patch[] {
  const blocks = LAYOUTS[layout];
  if (kind === "sketch") {
    return [
      ...blocks.flatMap((r) => outline(r.x, r.y, r.w, r.h, 0.03, PENCIL)),
      // A loose pencil stroke inside each of the first two, as if still being worked out.
      ...blocks.slice(0, 2).map((r) => ({ x: r.x + r.w * 0.2, y: r.y + r.h * 0.45, w: r.w * 0.55, h: 0.025, colour: PENCIL })),
    ];
  }
  if (kind === "wireframe") {
    return [
      ...blocks.map((r, i) => ({ ...r, colour: i % 2 ? PALE : GREY })),
      // A line of text to come, along the bottom edge.
      { x: 0.1, y: 0.05, w: 0.3, h: 0.035, colour: PALE },
    ];
  }
  if (kind === "palette") {
    return [
      { x: 0.08, y: 0.32, w: 0.25, h: 0.52, colour: a },
      { x: 0.375, y: 0.32, w: 0.25, h: 0.52, colour: b },
      { x: 0.67, y: 0.32, w: 0.25, h: 0.52, colour: c },
      // A name under each swatch.
      { x: 0.08, y: 0.17, w: 0.18, h: 0.045, colour: GREY },
      { x: 0.375, y: 0.17, w: 0.14, h: 0.045, colour: GREY },
      { x: 0.67, y: 0.17, w: 0.2, h: 0.045, colour: GREY },
    ];
  }
  return blocks.map((r, i) => ({ ...r, colour: [a, b, c, b][i] }));
}

/** Where a sheet is, how far it is turned (radians, anticlockwise), how big, and whether it is out. */
export type SheetPose = { x: number; y: number; z: number; turn: number; size: number; shown: boolean };

/** The fan opens from a point low on the easel, like cards held at the wrist. */
const PIVOT = { y: 0.7, z: 0.5 };
const RADIUS = 4.3;
/** The angle between neighbouring sheets. */
const SPREAD = (22 * Math.PI) / 180;

/** A sheet's place in the fan: `i` of `n`, left to right. */
export function fanSlot(i: number, n: number): SheetPose {
  const angle = (i - (n - 1) / 2) * SPREAD;
  return {
    x: Math.sin(angle) * RADIUS,
    y: PIVOT.y + Math.cos(angle) * RADIUS,
    // Each a little in front of the last, so overlapping corners never flicker.
    z: PIVOT.z + i * 0.05,
    // The middle sheet is turned by plain zero, not minus zero.
    turn: angle === 0 ? 0 : -angle,
    size: 1,
    shown: true,
  };
}

/** Packed away: small, on the canvas they came from. */
const PACKED: SheetPose = { x: 0, y: 1.57, z: 0.45, turn: 0, size: 0.3, shown: false };

/**
 * A picked sheet: held up above the easel, to the side away from him, and towards the visitor, upright and large enough to
 * read, with the finished piece on the canvas still in view below it.
 */
export const FRONT: SheetPose = { x: 1.5, y: 4, z: 2, turn: 0, size: 2.3, shown: true };

/** The first sheet leaves after this long, and each next one this long after the last. */
const FIRST = 0.3;
const STAGGER = 0.3;
/** Long enough for five sheets to come out and settle. Kept short: the facts never wait for it. */
export const FAN_SECONDS = FIRST + 4 * STAGGER + 0.6;

/**
 * Where sheet `i` of `n` should be heading.
 * - `open`: its project is the one being shown.
 * - `since`: seconds since it was opened.
 * - `front`: which sheet has been picked, or -1.
 * - `still`: motion is off, so nothing waits its turn.
 */
export function sheetTarget(i: number, n: number, now: { open: boolean; since: number; front: number; still?: boolean }): SheetPose {
  if (!now.open) return PACKED;
  if (now.front === i) return FRONT;
  return now.still || now.since >= FIRST + i * STAGGER ? fanSlot(i, n) : PACKED;
}

/** A picked sheet draws its picture again, patch by patch, in this many seconds. */
export const DRAW_SECONDS = 0.7;
/** How long one patch takes to go on. */
const PATCH_SECONDS = 0.25;

/** How much of patch `k` of `count` is drawn, `since` seconds after its sheet was picked: 0 to 1. */
export function patchShare(k: number, count: number, since: number): number {
  const gap = (DRAW_SECONDS - PATCH_SECONDS) / Math.max(1, count - 1);
  return Math.max(0, Math.min(1, (since - k * gap) / PATCH_SECONDS));
}

/** A sheet's place in the order, as a row of small squares along its top edge: one for the first, two for the second. */
export function stagePips(i: number): Patch[] {
  return Array.from({ length: i + 1 }, (_, k) => ({ x: 0.05 + k * 0.055, y: 0.915, w: 0.035, h: 0.048, colour: "#27374d" }));
}
