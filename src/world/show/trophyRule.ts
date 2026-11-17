/**
 * The trophy tent: the room inside the camp's tent, with one shelf on its back wall for each kind
 * of certificate and one object on the shelf for each certificate. Plain arithmetic, in the room's
 * own units: x across the wall from its middle, y up from the floor.
 */

export type Shape = "scroll" | "medal" | "badge" | "frame";

/** The kinds with a name and an object of their own. Any other kind is shown as framed certificates. */
export const KINDS: Record<string, { title: string; shape: Shape }> = {
  course: { title: "Courses", shape: "scroll" },
  sport: { title: "Sports", shape: "medal" },
  event: { title: "Events", shape: "badge" },
};

/** How many fit across a shelf before it wraps to another row. */
export const PER_ROW = 10;
/** Gaps between neighbours across a row, and between rows. */
export const SPACING = { across: 1.15, down: 1.5 };
/** How much bigger than their models the objects are drawn, to be read as things at a glance. */
export const OBJECT_SCALE = 1.5;
/** How deep the room runs, front to back: deep enough for the camera to take in the whole wall on a phone. */
export const DEPTH = 34;
/** The camera's lens inside the room: wide, as rooms are filmed. */
export const ROOM_FOV = 50;

/** The gap above the top row and below the bottom one. */
const MARGIN = { top: 1.4, bottom: 1.5 };

const keyOf = (kind: string) => kind.trim().toLowerCase();

/** A kind's shelf name: its own, or the kind itself with a capital letter. */
function titleOf(key: string) {
  return KINDS[key]?.title ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export type Shelf<T> = { kind: string; title: string; shape: Shape; items: T[]; rows: number };

/** The shelves, one per kind, in the order each kind first appears in the list. */
export function shelves<T extends { kind: string }>(list: T[]): Shelf<T>[] {
  const out: Shelf<T>[] = [];
  for (const item of list) {
    const key = keyOf(item.kind);
    let shelf = out.find((s) => s.kind === key);
    if (!shelf) {
      shelf = { kind: key, title: titleOf(key), shape: KINDS[key]?.shape ?? "frame", items: [], rows: 0 };
      out.push(shelf);
    }
    shelf.items.push(item);
  }
  for (const shelf of out) shelf.rows = Math.ceil(shelf.items.length / PER_ROW);
  return out;
}

const totalRows = (list: { kind: string }[]) => shelves(list).reduce((n, s) => n + s.rows, 0);

/** The back wall's size, and the height from the floor to the ceiling. */
export function roomSize(list: { kind: string }[]): { w: number; h: number } {
  const rows = Math.max(1, totalRows(list));
  // Only as wide as the longest row, so the objects are as big on screen as they can be.
  const cols = Math.max(4, ...shelves(list).map((s) => Math.min(PER_ROW, s.items.length)));
  return { w: cols * SPACING.across + 2.4, h: Math.max(5, MARGIN.bottom + (rows - 1) * SPACING.down + MARGIN.top + 0.6) };
}

/**
 * Where a picked certificate is shown: brought well out towards the camera, at the middle of the
 * screen, so it is seen up close and clear of every shelf behind it.
 */
export const displaySpot = (size: { w: number; h: number }) => ({ x: 0, y: size.h * 0.42, z: 5.5 });

/** Where each certificate sits on the wall, by its id: rows from the top down, each row centred. */
export function slots<T extends { id: string; kind: string }>(list: T[]): Record<string, { x: number; y: number; shelf: number }> {
  const out: Record<string, { x: number; y: number; shelf: number }> = {};
  const top = roomSize(list).h - MARGIN.top;
  let row = 0;
  shelves(list).forEach((shelf, s) => {
    for (let r = 0; r < shelf.rows; r++) {
      const inRow = shelf.items.slice(r * PER_ROW, (r + 1) * PER_ROW);
      inRow.forEach((item, i) => {
        out[item.id] = { x: (i - (inRow.length - 1) / 2) * SPACING.across, y: top - row * SPACING.down, shelf: s };
      });
      row++;
    }
  });
  return out;
}

/**
 * Where the camera stands inside the room: how far out from the back wall, and how high, so the
 * whole wall fits the screen (`aspect` is its width over its height) with a little room round it.
 * `free` is how much of the half-screen either side of the picture's middle the page leaves clear:
 * on a desktop the card takes the left of the screen, on a phone the sheet takes the bottom.
 */
export function roomCamera(size: { w: number; h: number }, aspect: number, free = { across: 1, down: 1 }): { distance: number; height: number } {
  const half = Math.tan(((ROOM_FOV / 2) * Math.PI) / 180);
  // Room to the right for him to stand beside the shelves.
  const across = (size.w / 2 + 1.6) / (half * aspect * free.across);
  const down = (size.h / 2 + 0.5) / (half * free.down);
  return { distance: Math.min(DEPTH - 1, Math.max(across, down)), height: size.h * 0.42 };
}
