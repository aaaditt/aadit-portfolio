import type { SectionId } from "@/content/sections";

export type Exhibit = {
  id: string;
  section: SectionId;
  kind: "easel" | "terminal" | "cabinet";
  x: number;
  z: number;
};

/**
 * The things standing in front of each landmark. Each one will stand for a project once there
 * is content. The middle one of each three is where the character works when he visits.
 */
export const EXHIBITS: Exhibit[] = [
  { id: "design-1", section: "design", kind: "easel", x: -21, z: -3.2 },
  { id: "design-2", section: "design", kind: "easel", x: -17.5, z: -2.4 },
  { id: "design-3", section: "design", kind: "easel", x: -14, z: -3.2 },
  { id: "code-1", section: "code", kind: "terminal", x: 14.2, z: -2.3 },
  { id: "code-2", section: "code", kind: "terminal", x: 17.5, z: -1.9 },
  { id: "code-3", section: "code", kind: "terminal", x: 20.5, z: -2.6 },
  { id: "play-1", section: "play", kind: "cabinet", x: -3.2, z: -17 },
  { id: "play-2", section: "play", kind: "cabinet", x: 0, z: -16.2 },
  { id: "play-3", section: "play", kind: "cabinet", x: 3.2, z: -17 },
];

export const exhibit = (id: string) => EXHIBITS.find((e) => e.id === id)!;
