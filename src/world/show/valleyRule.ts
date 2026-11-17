import { CLUBS } from "../../content/about";
import { projectsIn } from "../../content/projects";
import { plateau } from "../voxel/terrain";

/**
 * Light the valley: asked what he has done, a beam of light rises from each place he has work in,
 * tagged with how much is there, so the whole valley becomes a summary. Plain arithmetic and data.
 */

export type Beam = {
  id: "design" | "code" | "events" | "clubs";
  /** The place it leads to. */
  href: string;
  /** Its name on the tag. */
  name: string;
  /** How many, in words: "3 projects". */
  line: string;
  /** For the clubs beam, his standing role. */
  role?: string;
  /** How many, as a number, for the beam's height. */
  count: number;
  /** Where it stands in the world, at ground level. */
  x: number;
  z: number;
};

/** "1 project", "3 projects". */
export const countLine = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

/** The beams, in the order they rise: west to east across the valley, then the clubs. */
export function beams(): Beam[] {
  const at = (id: string) => plateau(id);
  const role = CLUBS.find((c) => !c.sample) ?? CLUBS[0];
  const count = (section: string) => projectsIn(section).length;
  return [
    // In each place's yard, in front of its building, where nothing stands in the way.
    { id: "design", href: "/design", name: "Design", count: count("design"), line: countLine(count("design"), "project"), x: at("design").x - 0.5, z: at("design").z + 8.5 },
    { id: "code", href: "/code", name: "Code", count: count("code"), line: countLine(count("code"), "build"), x: at("code").x - 3.5, z: at("code").z + 9 },
    { id: "events", href: "/events", name: "Events", count: count("events"), line: countLine(count("events"), "event"), x: at("events").x - 4, z: at("events").z + 2 },
    {
      id: "clubs",
      href: "/events",
      name: "Clubs",
      count: CLUBS.length,
      line: countLine(CLUBS.length, "club"),
      role: role ? `${role.role}, ${role.name}` : undefined,
      // By the banners in front of the stage.
      x: at("events").x + 8,
      z: at("events").z + 4,
    },
  ];
}

/** How tall a beam stands, for how much is there. */
export const beamHeight = (count: number) => 5 + Math.min(count, 40) * 0.8;

/** Each beam starts rising this long after the one before, and takes this long to reach full height. */
export const BEAM_GAP = 0.15;
export const RISE_SECONDS = 0.6;

/** How far beam `i` has risen, 0 to 1, `since` seconds after the question was asked. */
export function beamRise(i: number, since: number, still = false): number {
  if (still) return 1;
  const k = Math.max(0, Math.min(1, (since - i * BEAM_GAP) / RISE_SECONDS));
  return 1 - Math.pow(1 - k, 3);
}
