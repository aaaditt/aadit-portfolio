import type { SectionId } from "@/content/sections";
import { exhibit } from "./exhibitData";

export type Point = [x: number, z: number];

const easel = exhibit("design-2");
const terminal = exhibit("code-2");
const cabinet = exhibit("play-2");

/**
 * Places the character can run between. The plaza is a ring of points, because the well stands
 * in the middle of it.
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
  design: [easel.x + 1.15, easel.z + 1.5],
  // The lab's sculpture and the farm leave one lane between them, which comes out between two terminals.
  codeGate: [7.9, -7.7],
  // A little past the corner, because rounding it off cuts back in towards the sculpture.
  codeYard: [7.25, -3.45],
  codeLane: [16, -3.6],
  codeFront: [15.9, -0.2],
  codeTurn: [terminal.x + 1.85, terminal.z + 1.5],
  // He stands side-on to what he is working at, so the camera sees his arms, not his back.
  code: [terminal.x + 1.7, terminal.z + 0.3],
  play: [cabinet.x + 1.6, cabinet.z + 0.6],
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
  ["designYard", "design"],
  ["plazaE", "codeGate"],
  ["codeGate", "codeYard"],
  ["codeYard", "codeLane"],
  ["codeLane", "codeFront"],
  ["codeFront", "codeTurn"],
  ["codeTurn", "code"],
  ["plazaN", "play"],
];

const facing = (from: Point, x: number, z: number) => Math.atan2(x - from[0], z - from[1]);

/** Where he ends up for each section, and which way he turns once there (0 faces south, to the camera). */
export const STANDS: Record<SectionId, { node: NodeId; facing: number }> = {
  home: { node: "lookout", facing: 0 },
  about: { node: "lookout", facing: 0 },
  design: { node: "design", facing: facing(NODES.design, easel.x, easel.z + 0.3) },
  code: { node: "code", facing: facing(NODES.code, terminal.x, terminal.z + 0.3) },
  play: { node: "play", facing: facing(NODES.play, cabinet.x, cabinet.z + 0.6) },
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
