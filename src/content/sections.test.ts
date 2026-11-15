import { expect, test } from "vitest";
import { SECTIONS, getSection, sectionForPath } from "./sections";

test("sections have unique ids and hrefs, with home first", () => {
  expect(SECTIONS[0].id).toBe("home");
  expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length);
  expect(new Set(SECTIONS.map((s) => s.href)).size).toBe(SECTIONS.length);
});

test("sectionForPath matches each section's own path", () => {
  for (const s of SECTIONS) expect(sectionForPath(s.href).id).toBe(s.id);
});

test("sectionForPath handles trailing slashes and nested paths", () => {
  expect(sectionForPath("/design/").id).toBe("design");
  expect(sectionForPath("/code/some-project").id).toBe("code");
});

test("unknown paths fall back to home", () => {
  expect(sectionForPath("/nope").id).toBe("home");
  expect(sectionForPath("").id).toBe("home");
  expect(getSection("nope")).toBeUndefined();
});
