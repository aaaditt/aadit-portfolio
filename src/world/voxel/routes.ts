import { SECTIONS, type SectionId } from "../../content/sections";
import { EXHIBITS, exhibit, type Exhibit } from "./exhibitData";

export type Point = [x: number, z: number];

/**
 * Where he stands to use an exhibit: at its front corner, turned in to face it, close enough to
 * reach it. He is a good deal taller than what he works at, so standing square in front of it
 * would hide it from the camera; from the corner, both he and his work can be seen. He takes the
 * side away from the section's camera.
 * - `ahead`: how far in front of the exhibit's middle (its controls stick out further on a cabinet).
 * - `aside`: how far to the side: just clear of its edge.
 */
const REACH: Record<Exhibit["kind"], { ahead: number; aside: number }> = {
  easel: { ahead: 0.95, aside: 1.35 },
  terminal: { ahead: 0.8, aside: 1.25 },
  cabinet: { ahead: 1.15, aside: 1.15 },
};

/**
 * Exhibits where the usual side will not do: the farm is just west of the first terminal, the
 * ground steps down west of the middle one, and the cottage is close east of the last.
 */
const CROWDED: Record<string, 1 | -1> = { "code-1": 1, "code-2": 1, "code-3": -1 };

/** Which side of an exhibit he stands: -1 west, 1 east. */
function sideOf(e: Exhibit) {
  if (CROWDED[e.id]) return CROWDED[e.id];
  const camera = SECTIONS.find((s) => s.id === e.section)!.camera.position[0];
  return e.x >= camera ? 1 : -1;
}

/** The spot in front of an exhibit where he works at it. */
export function workSpot(e: Exhibit): Point {
  const { ahead, aside } = REACH[e.kind];
  return [e.x + sideOf(e) * aside, e.z + ahead];
}

/** The middle point of what he works at: the canvas, the screen, or the controls. */
const workFace = (e: Exhibit): Point => [e.x, e.z + (e.kind === "cabinet" ? 0.7 : 0.3)];

const spots = Object.fromEntries(EXHIBITS.map((e) => [e.id, workSpot(e)])) as Record<
  "design-1" | "design-2" | "design-3" | "code-1" | "code-2" | "code-3" | "play-1" | "play-2" | "play-3",
  Point
>;

/**
 * Places the character can run between. The plaza is a ring of points, because the well stands
 * in the middle of it. Each exhibit has its own spot, named after it.
 */
export const NODES = {
  lookout: [1.2, 27.2],
  camp: [2.4, 22.6],
  trailhead: [0, 18],
  bridge: [0, 8],
  plazaS: [0, -4.3],
  plazaSW: [-2.9, -4.9],
  plazaW: [-3.4, -7.5],
  plazaNW: [-2.9, -10.1],
  plazaN: [0, -10.6],
  plazaNE: [2.9, -10.1],
  plazaE: [3.4, -7.5],
  plazaSE: [2.9, -4.9],
  designGate: [-11, -8],
  designYard: [-12.2, -0.6],
  // A walk along the front of the easels, so he can step from one to the next.
  designRow: [-17.5, 0.2],
  // The lab's sculpture and the farm leave one lane between them, which comes out between two terminals.
  codeGate: [7.9, -7.7],
  // A little past the corner, because rounding it off cuts back in towards the sculpture.
  codeYard: [7.25, -3.45],
  codeLane: [16, -3.6],
  codeFront: [15.9, -0.2],
  codeRow: [19.2, 0],
  playRow: [0, -13.4],
  // Under the lamp that stands between the row and the left cabinet.
  playWest: [-1.1, -15.0],
  // Then straight in to the left cabinet from the south, clear of its controls.
  playCorner: [-4.6, -14.85],
  ...spots,
} satisfies Record<string, Point>;

export type NodeId = keyof typeof NODES;

const EDGES: [NodeId, NodeId][] = [
  ["lookout", "camp"],
  ["camp", "trailhead"],
  ["trailhead", "bridge"],
  ["bridge", "plazaS"],
  ["plazaS", "plazaSW"],
  ["plazaSW", "plazaW"],
  ["plazaW", "plazaNW"],
  ["plazaNW", "plazaN"],
  ["plazaN", "plazaNE"],
  ["plazaNE", "plazaE"],
  ["plazaE", "plazaSE"],
  ["plazaSE", "plazaS"],
  ["plazaW", "designGate"],
  ["designGate", "designYard"],
  ["designYard", "designRow"],
  ["designYard", "design-3"],
  ["designRow", "design-1"],
  ["designRow", "design-2"],
  ["designRow", "design-3"],
  ["plazaE", "codeGate"],
  ["codeGate", "codeYard"],
  ["codeYard", "codeLane"],
  ["codeLane", "codeFront"],
  ["codeFront", "code-1"],
  ["codeFront", "codeRow"],
  ["codeRow", "code-2"],
  ["codeRow", "code-3"],
  ["plazaN", "playRow"],
  ["playRow", "playWest"],
  ["playWest", "playCorner"],
  ["playCorner", "play-1"],
  ["playRow", "play-2"],
  ["playRow", "play-3"],
];

const facing = (from: Point, [x, z]: Point) => Math.atan2(x - from[0], z - from[1]);

export type Stand = { node: NodeId; facing: number; exhibit: string | null };

/** Where he stands to work at an exhibit, and the way he faces there. */
export function standAt(exhibitId: string): Stand {
  const e = exhibit(exhibitId);
  const node = e.id as NodeId;
  return { node, facing: facing(NODES[node], workFace(e)), exhibit: e.id };
}

/**
 * Where he ends up for each section when no particular project is open, and which way he turns
 * once there (0 faces south, to the camera). In a section with exhibits, that is the middle one.
 */
export const STANDS: Record<SectionId, Stand> = {
  home: { node: "lookout", facing: 0, exhibit: null },
  about: { node: "lookout", facing: 0, exhibit: null },
  design: standAt("design-2"),
  code: standAt("code-2"),
  play: standAt("play-2"),
};

const distance = (a: Point, c: Point) => Math.hypot(c[0] - a[0], c[1] - a[1]);

/** The shortest chain of places from one to another, both ends included. */
export function route(from: NodeId, to: NodeId): NodeId[] {
  const ids = Object.keys(NODES) as NodeId[];
  const cost = new Map<NodeId, number>(ids.map((id) => [id, Infinity]));
  const previous = new Map<NodeId, NodeId>();
  const open = new Set<NodeId>(ids);
  cost.set(from, 0);

  while (open.size > 0) {
    let here: NodeId | null = null;
    for (const id of open) if (here === null || cost.get(id)! < cost.get(here)!) here = id;
    if (here === null || here === to) break;
    open.delete(here);
    for (const [a, c] of EDGES) {
      const next = a === here ? c : c === here ? a : null;
      if (next === null || !open.has(next)) continue;
      const total = cost.get(here)! + distance(NODES[here], NODES[next]);
      if (total < cost.get(next)!) {
        cost.set(next, total);
        previous.set(next, here);
      }
    }
  }

  const path: NodeId[] = [to];
  while (path[0] !== from) path.unshift(previous.get(path[0])!);
  return path;
}

/** The length of a line through the given points. */
export function lengthOf(points: Point[]): number {
  let total = 0;
  for (let i = 0; i + 1 < points.length; i++) total += distance(points[i], points[i + 1]);
  return total;
}

/**
 * The position a given distance along a line through the points, the direction of travel there
 * (as a turn about the vertical, 0 facing +z), and which stretch it is on.
 */
export function pointAlong(points: Point[], travelled: number): { x: number; z: number; heading: number; leg: number } {
  let left = Math.max(0, travelled);
  let heading = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[i + 1];
    const run = distance(points[i], points[i + 1]);
    if (run === 0) continue;
    heading = Math.atan2(x2 - x1, z2 - z1);
    if (left <= run) return { x: x1 + ((x2 - x1) * left) / run, z: z1 + ((z2 - z1) * left) / run, heading, leg: i };
    left -= run;
  }
  const [x, z] = points[points.length - 1];
  return { x, z, heading, leg: Math.max(0, points.length - 2) };
}

/** How far either side of him the corner-rounding looks, in blocks. */
const ROUNDING = 0.9;

/**
 * The same as pointAlong, but with the corners rounded off: he is drawn midway between a point
 * a little behind and a point a little ahead, so he sweeps through turns instead of pivoting.
 */
export function smoothAlong(points: Point[], travelled: number): { x: number; z: number; heading: number } {
  const total = lengthOf(points);
  const d = Math.min(total, Math.max(0, travelled));
  // The window closes at both ends, so he starts and stops exactly on his spot.
  const reach = Math.min(ROUNDING, d, total - d);
  const exact = pointAlong(points, d);
  if (reach < 0.05) return exact;
  const behind = pointAlong(points, d - reach);
  const ahead = pointAlong(points, d + reach);
  return {
    x: (behind.x + ahead.x) / 2,
    z: (behind.z + ahead.z) / 2,
    heading: Math.atan2(ahead.x - behind.x, ahead.z - behind.z),
  };
}

/**
 * A route for someone who is part-way between two neighbouring places and now wants to go
 * somewhere else. He sets off from where he is, by whichever end of the stretch is quicker.
 */
export function routeFrom(at: Point, behind: NodeId, ahead: NodeId, to: NodeId): Point[] {
  const viaAhead = route(ahead, to).map((id) => NODES[id]);
  const viaBehind = route(behind, to).map((id) => NODES[id]);
  const costAhead = distance(at, NODES[ahead]) + lengthOf(viaAhead);
  const costBehind = distance(at, NODES[behind]) + lengthOf(viaBehind);
  return [at, ...(costAhead <= costBehind ? viaAhead : viaBehind)];
}
