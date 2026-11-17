export type SectionId = "home" | "design" | "code" | "events" | "about";

type Vec3 = [number, number, number];

export type Section = {
  id: SectionId;
  /** Short name shown in the bottom bar. */
  label: string;
  href: string;
  /** Heading shown when the section is open. */
  title: string;
  blurb: string;
  /** What he says on getting there. Home has his greeting instead. */
  line?: string;
  /** Where the camera sits and what it looks at for this section. */
  camera: { position: Vec3; target: Vec3 };
};

export const SECTIONS: Section[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    title: "Aadit",
    blurb: "Design, code and events.",
    // A little closer than the whole valley, so he is not lost in it, with the camp round him.
    camera: { position: [8.1, 14, 46], target: [0, 9.5, 10] },
  },
  {
    id: "design",
    label: "Design",
    href: "/design",
    title: "Design Studio",
    blurb: "Interfaces, visuals and brand work.",
    line: "Pick an easel!",
    camera: { position: [-17, 16, 15], target: [-18, 5, -8] },
  },
  {
    id: "code",
    label: "Code",
    href: "/code",
    title: "Code Lab",
    blurb: "Apps, tools and experiments in software.",
    line: "Pick a machine!",
    camera: { position: [18.5, 20, 19], target: [15, 4.5, -7] },
  },
  {
    id: "events",
    label: "Events",
    href: "/events",
    title: "The Grounds",
    blurb: "Events I've run, and the clubs I'm part of.",
    line: "Pick an event!",
    camera: { position: [4.2, 19.5, 3.5], target: [1, 5, -20] },
  },
  {
    id: "about",
    label: "About",
    href: "/about",
    title: "About & contact",
    blurb: "Who I am and how to reach me.",
    line: "Ask me anything!",
    camera: { position: [6.2, 8.6, 35.6], target: [0.8, 9.4, 27.3] },
  },
];

export const HOME = SECTIONS[0];

export function getSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}

/** The section a URL path belongs to. Unknown paths fall back to home. */
export function sectionForPath(pathname: string): Section {
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first) return HOME;
  return SECTIONS.find((s) => s.href === `/${first}`) ?? HOME;
}
