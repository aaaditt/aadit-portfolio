import type { SectionId } from "@/content/sections";
import { NODES, STANDS, lengthOf, pointAlong, route, routeFrom, smoothAlong, type NodeId, type Point } from "./voxel/routes";
import { groundY } from "./voxel/terrain";

/** How fast he runs, in blocks a second, before the limits below. */
const PACE = 14;
/** No run takes longer than this, however far it is. */
const LONGEST = 3.6;
const SHORTEST = 0.5;

/** The stone slab he stands on at the lookout: x from, x to, z from, z to, and its thickness. */
const SLAB = [-0.2, 2.6, 25.8, 28.6, 0.2];

const floor = (x: number, z: number) =>
  groundY(x, z) + (x > SLAB[0] && x < SLAB[1] && z > SLAB[2] && z < SLAB[3] ? SLAB[4] : 0);

/** Off at a dash, fastest a third of the way there, and slowing to a stop on arrival. */
const ease = (p: number) => p + p * p - p * p * p;

let points: Point[] = [NODES.lookout];
/** The place each point is, or null for a point part-way along a stretch. */
let stops: (NodeId | null)[] = ["lookout"];
/** When the run began part-way along a stretch: the two places that stretch joins. */
let startedBetween: [NodeId, NodeId] | null = null;
let total = 0;
let seconds = 1;
let elapsed = 0;
let travelled = 0;
let at: NodeId = "lookout";

/**
 * Where the character is and where he is going. The scene writes and reads this every frame, so
 * it is a plain object, not React state.
 */
export const walker = {
  x: NODES.lookout[0],
  y: floor(...NODES.lookout),
  z: NODES.lookout[1],
  /** The way he is facing or should turn to face, as a turn about the vertical. 0 faces south. */
  heading: 0,
  moving: false,
  /** How far through the current run he is, from 0 to 1. */
  progress: 1,
  /** Blocks a second, right now. */
  speed: 0,
  /** The section he is at, or on his way to. */
  section: "home" as SectionId,

  /** Puts him at a section's spot at once, with no run. */
  place(section: SectionId) {
    const stand = STANDS[section];
    at = stand.node;
    [walker.x, walker.z] = NODES[at];
    walker.y = floor(walker.x, walker.z);
    walker.heading = stand.facing;
    walker.moving = false;
    walker.progress = 1;
    walker.speed = 0;
    walker.section = section;
  },

  /** Sends him to a section. False if he is already standing where it is. */
  go(section: SectionId): boolean {
    const to = STANDS[section].node;
    walker.section = section;

    if (!walker.moving) {
      if (at === to) {
        walker.heading = STANDS[section].facing;
        return false;
      }
      stops = route(at, to);
      points = stops.map((id) => NODES[id!]);
      startedBetween = null;
    } else {
      // Already running: carry on from here, by whichever end of this stretch is quicker.
      const leg = pointAlong(points, travelled).leg;
      const behind = stops[leg];
      const [a, c]: [NodeId, NodeId] = behind === null ? startedBetween! : [behind, stops[leg + 1]!];
      const here: Point = [walker.x, walker.z];
      points = routeFrom(here, a, c, to);
      const first = points[1] === NODES[a] ? a : c;
      stops = [null, ...route(first, to)];
      startedBetween = first === a ? [c, a] : [a, c];
    }

    total = lengthOf(points);
    if (total < 0.01) {
      walker.place(section);
      return false;
    }
    seconds = Math.min(LONGEST, Math.max(SHORTEST, total / PACE));
    elapsed = 0;
    travelled = 0;
    walker.moving = true;
    walker.progress = 0;
    return true;
  },

  /** Moves him on by a frame. */
  advance(delta: number) {
    if (!walker.moving) return;
    elapsed += delta;
    walker.progress = Math.min(1, elapsed / seconds);
    const now = total * ease(walker.progress);
    walker.speed = delta > 0 ? (now - travelled) / delta : 0;
    travelled = now;
    const point = smoothAlong(points, travelled);
    walker.x = point.x;
    walker.z = point.z;
    walker.heading = point.heading;
    // Ease onto each new level, so steps and slopes are climbed, not snapped to.
    walker.y += (floor(point.x, point.z) - walker.y) * (1 - Math.exp(-16 * delta));

    if (walker.progress >= 1) {
      const last = stops[stops.length - 1]!;
      walker.place(walker.section);
      at = last;
    }
  },
};
