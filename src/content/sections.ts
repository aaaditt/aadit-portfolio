export type SectionId = "home" | "design" | "code" | "play" | "about";

type Vec3 = [number, number, number];

export type Section = {
  id: SectionId;
  /** Short name shown in the bottom bar. */
  label: string;
  href: string;
  /** Heading shown when the section is open. */
  title: string;
  blurb: string;
  /** Where the camera sits and what it looks at for this section. */
  camera: { position: Vec3; target: Vec3 };
};

export const SECTIONS: Section[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    title: "Aadit",
    blurb: "Design, code, games and events.",
    camera: { position: [10, 16.5, 48], target: [0, 6.5, 12] },
  },
  {
    id: "design",
    label: "Design",
    href: "/design",
    title: "Design Studio",
    blurb: "Interfaces, visuals and brand work.",
    camera: { position: [-30, 12, 10], target: [-16, 5.5, -8] },
  },
  {
    id: "code",
    label: "Code",
    href: "/code",
    title: "Code Lab",
    blurb: "Apps, tools and experiments in software.",
    camera: { position: [31, 12, 10], target: [17, 5.5, -8] },
  },
  {
    id: "play",
    label: "Play",
    href: "/play",
    title: "Arcade",
    blurb: "Games and events I've made or run.",
    camera: { position: [13, 14, 1], target: [0, 7, -23] },
  },
  {
    id: "about",
    label: "About",
    href: "/about",
    title: "About & contact",
    blurb: "Who I am and how to reach me.",
    camera: { position: [6.5, 9.8, 35], target: [0.8, 8.5, 26.5] },
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
