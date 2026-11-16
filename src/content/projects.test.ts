import { expect, test } from "vitest";
import { EXHIBITS } from "../world/voxel/exhibitData";
import { PROJECTS, exhibitFor, getProject, liveLinks, mainLink, neighbours, projectFor, projectsIn, whereIs } from "./projects";

const SECTIONS = ["design", "code", "play"] as const;

test("each section with exhibits has exactly three projects, one per exhibit", () => {
  for (const section of SECTIONS) {
    expect(projectsIn(section)).toHaveLength(3);
    expect(EXHIBITS.filter((e) => e.section === section)).toHaveLength(3);
  }
  expect(PROJECTS).toHaveLength(9);
});

test("every project can be linked to: a unique, URL-safe name", () => {
  const ids = PROJECTS.map((p) => p.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("every project has what its card shows", () => {
  for (const p of PROJECTS) {
    expect(p.title.length, p.id).toBeGreaterThan(0);
    expect(p.blurb.length, p.id).toBeGreaterThan(10);
    expect(p.blurb.length, p.id).toBeLessThanOrEqual(110);
    expect(p.role.length, p.id).toBeGreaterThan(0);
    expect(p.tools.length, p.id).toBeGreaterThan(0);
    expect(p.year, p.id).toBeGreaterThanOrEqual(2015);
    expect(p.colours, p.id).toHaveLength(3);
    for (const c of p.colours) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    for (const link of p.links) expect(link.href, p.id).toMatch(/^(https?:\/\/|\/)/);
    // What recruiters look for first: what came of it, who it was with, and where it got to.
    expect(p.outcome.length, p.id).toBeGreaterThan(10);
    expect(p.team.length, p.id).toBeGreaterThan(0);
    expect(["Shipped", "Prototype", "In progress"]).toContain(p.status);
  }
});

test("placeholders are clearly marked as samples, and say so in their one line", () => {
  for (const p of PROJECTS) {
    if (!p.sample) continue;
    expect(p.blurb, p.id).toMatch(/^A placeholder/);
    // The SAMPLE badge says it once; the title should not say it again.
    expect(p.title, p.id).not.toMatch(/sample/i);
    // Their links are shown, but as not ready yet.
    expect(p.links.length, p.id).toBeGreaterThan(0);
    for (const link of p.links) expect(link.soon, p.id).toBe(true);
  }
});

test("you can step from each project to the next and back, round and round", () => {
  const [first, second, third] = projectsIn("code");
  expect(neighbours(first)).toEqual({ previous: third, next: second, position: 1, count: 3 });
  expect(neighbours(third).next).toBe(first);
});

test("each project says where its exhibit stands", () => {
  const [left, middle, right] = projectsIn("design");
  expect(whereIs(left)).toBe("the left easel");
  expect(whereIs(middle)).toBe("the middle easel");
  expect(whereIs(projectsIn("play")[2])).toBe("the right arcade cabinet");
  expect(whereIs(projectsIn("code")[1])).toBe("the middle terminal");
  expect(right.id).toBeTruthy();
});

test("exhibits and projects find each other", () => {
  for (const e of EXHIBITS) {
    const p = projectFor(e.id);
    expect(p.section).toBe(e.section);
    expect(exhibitFor(p.id)?.id).toBe(e.id);
  }
  expect(getProject("design", projectsIn("design")[0].id)).toBe(projectsIn("design")[0]);
  expect(getProject("code", projectsIn("design")[0].id)).toBeUndefined();
  expect(getProject("design", "nope")).toBeUndefined();
});

test("links that are not ready are left out, and the first ready one is the main link", () => {
  const base = PROJECTS[0];
  const p = { ...base, links: [{ label: "Case study", href: "/", soon: true }, { label: "Live", href: "https://example.com" }] };
  expect(liveLinks(p)).toEqual([{ label: "Live", href: "https://example.com" }]);
  expect(mainLink(p)?.label).toBe("Live");
  expect(liveLinks(base)).toEqual([]);
  expect(mainLink(base)).toBeUndefined();
});

test("a project with a show has a few named sheets, each with something to say, ending on the final piece", () => {
  const shows = PROJECTS.filter((p) => p.show);
  expect(shows.length).toBeGreaterThan(0);
  for (const p of shows) {
    const sheets = p.show!.sheets;
    expect(p.section, p.id).toBe("design");
    expect(sheets.length, p.id).toBeGreaterThanOrEqual(3);
    expect(sheets.length, p.id).toBeLessThanOrEqual(5);
    expect(new Set(sheets.map((s) => s.kind)).size, p.id).toBe(sheets.length);
    expect(sheets.at(-1)!.kind, p.id).toBe("final");
    for (const s of sheets) {
      expect(s.label.length, p.id).toBeGreaterThan(0);
      expect(s.note.length, p.id).toBeGreaterThan(10);
      if (p.sample) expect(s.note, p.id).toMatch(/^A placeholder/);
    }
  }
});
