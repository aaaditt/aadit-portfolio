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
    camera: { position: [0, 10.5, 25.5], target: [0, -0.4, 0] },
  },
  {
    id: "design",
    label: "Design",
    href: "/design",
    title: "Design Studio",
    blurb: "Interfaces, visuals and brand work.",
    camera: { position: [-10, 4.6, 7.5], target: [-6.8, 1.2, -1] },
  },
  {
    id: "code",
    label: "Code",
    href: "/code",
    title: "Code Lab",
    blurb: "Apps, tools and experiments in software.",
    camera: { position: [8.6, 4.6, 7.5], target: [4.4, 1.2, -1] },
  },
  {
    id: "play",
    label: "Play",
    href: "/play",
    title: "Arcade",
    blurb: "Games and events I've made or run.",
    camera: { position: [3.2, 4.4, 3.4], target: [0, 1.3, -5.8] },
  },
  {
    id: "about",
    label: "About",
    href: "/about",
    title: "About & contact",
    blurb: "Who I am and how to reach me.",
    camera: { position: [-4.5, 5.2, 13.5], target: [0, 0.5, 5.4] },
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
