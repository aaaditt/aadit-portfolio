import { expect, test } from "vitest";
import { EXHIBITS } from "../world/voxel/exhibitData";
import { PROJECTS, exhibitFor, getProject, projectFor, projectsIn } from "./projects";

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
  }
});

test("placeholders are clearly marked as samples", () => {
  for (const p of PROJECTS) {
    if (p.sample) expect(p.title, p.id).toMatch(/^Sample /);
  }
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
