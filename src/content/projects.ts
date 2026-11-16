import { EXHIBITS } from "../world/voxel/exhibitData";

/** The sections that have projects in them. */
export type WorkSection = "design" | "code" | "play";

export type Project = {
  /** Used in the address: /design/<id>. Lower case words joined by hyphens. */
  id: string;
  section: WorkSection;
  title: string;
  /** One line, shown on the card. */
  blurb: string;
  role: string;
  tools: string[];
  year: number;
  links: { label: string; href: string }[];
  /** Three colours: they paint the project's exhibit in the world and its pixel thumbnail. */
  colours: [string, string, string];
  /** True for the placeholders. Replace them with real work and drop this flag. */
  sample?: boolean;
};

/**
 * Every project, in the order their exhibits stand left to right in front of each building.
 * These are placeholders: swap in real work, keeping three per section (one per exhibit).
 */
export const PROJECTS: Project[] = [
  {
    id: "brand-refresh",
    section: "design",
    title: "Sample brand refresh",
    blurb: "A placeholder for a branding project: logo, colours and type for a small studio.",
    role: "Designer",
    tools: ["Figma", "Illustrator"],
    year: 2025,
    links: [],
    colours: ["#c8553d", "#e8c15a", "#2f7f79"],
    sample: true,
  },
  {
    id: "app-redesign",
    section: "design",
    title: "Sample app redesign",
    blurb: "A placeholder for interface work: reworking a busy app into something calm.",
    role: "UI/UX designer",
    tools: ["Figma", "Protopie"],
    year: 2025,
    links: [],
    colours: ["#4f86c6", "#e79aa0", "#e3b341"],
    sample: true,
  },
  {
    id: "poster-series",
    section: "design",
    title: "Sample poster series",
    blurb: "A placeholder for visual work: a set of event posters in a shared style.",
    role: "Designer",
    tools: ["Photoshop", "InDesign"],
    year: 2024,
    links: [],
    colours: ["#4f9a4d", "#e58f3c", "#27374d"],
    sample: true,
  },
  {
    id: "portfolio-world",
    section: "code",
    title: "Sample portfolio site",
    blurb: "A placeholder entry about this site: a small voxel valley built in the browser.",
    role: "Designer and developer",
    tools: ["Next.js", "three.js", "Web Audio"],
    year: 2026,
    links: [{ label: "Home", href: "/" }],
    colours: ["#e8c15a", "#9fd3e6", "#9bbf4f"],
    sample: true,
  },
  {
    id: "study-tool",
    section: "code",
    title: "Sample study tool",
    blurb: "A placeholder for an app: a tool that turns notes into practice questions.",
    role: "Developer",
    tools: ["TypeScript", "React"],
    year: 2025,
    links: [],
    colours: ["#e79aa0", "#9fd3e6", "#9bbf4f"],
    sample: true,
  },
  {
    id: "data-scraper",
    section: "code",
    title: "Sample data experiment",
    blurb: "A placeholder for an experiment: gathering and charting public data.",
    role: "Developer",
    tools: ["Python", "Pandas"],
    year: 2024,
    links: [],
    colours: ["#e58f3c", "#9fd3e6", "#9bbf4f"],
    sample: true,
  },
  {
    id: "jam-game",
    section: "play",
    title: "Sample game jam entry",
    blurb: "A placeholder for a game: a small puzzle game made in a weekend.",
    role: "Game designer and programmer",
    tools: ["Godot"],
    year: 2025,
    links: [],
    colours: ["#2f7f79", "#9be7c4", "#e8c15a"],
    sample: true,
  },
  {
    id: "campus-event",
    section: "play",
    title: "Sample campus event",
    blurb: "A placeholder for an event: a gaming night for a hundred students.",
    role: "Organiser",
    tools: ["Planning", "Notion"],
    year: 2025,
    links: [],
    colours: ["#27374d", "#ffd27a", "#c8553d"],
    sample: true,
  },
  {
    id: "board-game",
    section: "play",
    title: "Sample board game",
    blurb: "A placeholder for a tabletop game: rules, cards and playtests.",
    role: "Designer",
    tools: ["Paper", "Figma"],
    year: 2024,
    links: [],
    colours: ["#e58f3c", "#bfe9ff", "#4f86c6"],
    sample: true,
  },
];

export const projectsIn = (section: string) => PROJECTS.filter((p) => p.section === section);

export const getProject = (section: string, id: string) => PROJECTS.find((p) => p.section === section && p.id === id);

/** The project an exhibit stands for: the nth exhibit of a section is its nth project. */
export function projectFor(exhibitId: string): Project {
  const exhibit = EXHIBITS.find((e) => e.id === exhibitId)!;
  const nth = EXHIBITS.filter((e) => e.section === exhibit.section).indexOf(exhibit);
  return projectsIn(exhibit.section)[nth];
}

/** The exhibit that stands for a project, if any. */
export function exhibitFor(projectId: string) {
  return EXHIBITS.find((e) => projectFor(e.id).id === projectId);
}

/** The project a page address is about, if it is a project page: /design/<id>. */
export function projectForPath(pathname: string): Project | undefined {
  const [section, id] = pathname.split("/").filter(Boolean);
  return section && id ? getProject(section, id) : undefined;
}
