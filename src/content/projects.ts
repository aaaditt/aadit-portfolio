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
  /** What came of it: the result, in one line. Recruiters read this first. */
  outcome: string;
  role: string;
  /** Who it was with: "Solo", "Team of four", a client... */
  team: string;
  status: "Shipped" | "Prototype" | "In progress";
  tools: string[];
  year: number;
  /** `soon` shows the button greyed out, for a link that is not ready yet. */
  links: { label: string; href: string; soon?: boolean }[];
  /** A real screenshot for the card, in /public, once there is one. Until then a pixel picture is drawn. */
  cover?: string;
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
    title: "Brand refresh",
    blurb: "A placeholder for a branding project: logo, colours and type for a small studio.",
    outcome: "A placeholder outcome: the studio's bookings went up after launch.",
    role: "Designer",
    team: "Solo",
    status: "Shipped",
    tools: ["Figma", "Illustrator"],
    year: 2025,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
    colours: ["#c8553d", "#e8c15a", "#2f7f79"],
    sample: true,
  },
  {
    id: "app-redesign",
    section: "design",
    title: "App redesign",
    blurb: "A placeholder for interface work: reworking a busy app into something calm.",
    outcome: "A placeholder outcome: testers finished tasks faster in the redesign.",
    role: "UI/UX designer",
    team: "Team of three",
    status: "Prototype",
    tools: ["Figma", "Protopie"],
    year: 2025,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
    colours: ["#4f86c6", "#e79aa0", "#e3b341"],
    sample: true,
  },
  {
    id: "poster-series",
    section: "design",
    title: "Poster series",
    blurb: "A placeholder for visual work: a set of event posters in a shared style.",
    outcome: "A placeholder outcome: the posters were used across a whole term of events.",
    role: "Designer",
    team: "Solo",
    status: "Shipped",
    tools: ["Photoshop", "InDesign"],
    year: 2024,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
    colours: ["#4f9a4d", "#e58f3c", "#27374d"],
    sample: true,
  },
  {
    id: "portfolio-world",
    section: "code",
    title: "This portfolio",
    blurb: "A placeholder entry about this site: a small voxel valley built in the browser.",
    outcome: "A placeholder outcome: a portfolio people remember and want to explore.",
    role: "Designer and developer",
    team: "Solo",
    status: "In progress",
    tools: ["Next.js", "three.js", "Web Audio"],
    year: 2026,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
    colours: ["#e8c15a", "#9fd3e6", "#9bbf4f"],
    sample: true,
  },
  {
    id: "study-tool",
    section: "code",
    title: "Study tool",
    blurb: "A placeholder for an app: a tool that turns notes into practice questions.",
    outcome: "A placeholder outcome: classmates used it to revise for exams.",
    role: "Developer",
    team: "Team of two",
    status: "Prototype",
    tools: ["TypeScript", "React"],
    year: 2025,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
    colours: ["#e79aa0", "#9fd3e6", "#9bbf4f"],
    sample: true,
  },
  {
    id: "data-scraper",
    section: "code",
    title: "Data experiment",
    blurb: "A placeholder for an experiment: gathering and charting public data.",
    outcome: "A placeholder outcome: a clear chart of a trend nobody had plotted.",
    role: "Developer",
    team: "Solo",
    status: "Prototype",
    tools: ["Python", "Pandas"],
    year: 2024,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
    colours: ["#e58f3c", "#9fd3e6", "#9bbf4f"],
    sample: true,
  },
  {
    id: "jam-game",
    section: "play",
    title: "Game jam entry",
    blurb: "A placeholder for a game: a small puzzle game made in a weekend.",
    outcome: "A placeholder outcome: placed in the top ten of the jam.",
    role: "Game designer and programmer",
    team: "Team of four",
    status: "Shipped",
    tools: ["Godot"],
    year: 2025,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
    colours: ["#2f7f79", "#9be7c4", "#e8c15a"],
    sample: true,
  },
  {
    id: "campus-event",
    section: "play",
    title: "Campus event",
    blurb: "A placeholder for an event: a gaming night for a hundred students.",
    outcome: "A placeholder outcome: a full room, and asked to run it again.",
    role: "Organiser",
    team: "Team of five",
    status: "Shipped",
    tools: ["Planning", "Notion"],
    year: 2025,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
    colours: ["#27374d", "#ffd27a", "#c8553d"],
    sample: true,
  },
  {
    id: "board-game",
    section: "play",
    title: "Board game",
    blurb: "A placeholder for a tabletop game: rules, cards and playtests.",
    outcome: "A placeholder outcome: three rounds of playtests shaped the rules.",
    role: "Designer",
    team: "Solo",
    status: "Prototype",
    tools: ["Paper", "Figma"],
    year: 2024,
    links: [
      { label: "Case study", href: "/", soon: true },
      { label: "Live", href: "/", soon: true },
    ],
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

/** The projects either side of this one in its section, wrapping round, and where it falls. */
export function neighbours(project: Project) {
  const list = projectsIn(project.section);
  const i = list.indexOf(project);
  return {
    previous: list[(i + list.length - 1) % list.length],
    next: list[(i + 1) % list.length],
    position: i + 1,
    count: list.length,
  };
}

const KIND_NAMES = { easel: "easel", terminal: "terminal", cabinet: "arcade cabinet" } as const;

/** Where a project's exhibit stands in the world, in words: "the middle easel". */
export function whereIs(project: Project): string {
  const exhibit = exhibitFor(project.id);
  if (!exhibit) return "";
  const nth = EXHIBITS.filter((e) => e.section === exhibit.section).indexOf(exhibit);
  return `the ${["left", "middle", "right"][nth]} ${KIND_NAMES[exhibit.kind]}`;
}
