import { expect, test } from "vitest";
import { MOODS, getMood } from "./moods";

test("there are exactly three moods with unique ids", () => {
  expect(MOODS).toHaveLength(3);
  expect(new Set(MOODS.map((m) => m.id)).size).toBe(3);
});

test("every palette colour is a 6-digit hex", () => {
  for (const m of MOODS) {
    for (const c of Object.values(m.palette)) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
  }
});

test("moods differ in shape and material", () => {
  expect(new Set(MOODS.map((m) => m.shape)).size).toBe(3);
  expect(new Set(MOODS.map((m) => m.material)).size).toBe(3);
});

test("getMood returns undefined for unknown ids", () => {
  expect(getMood("nope")).toBeUndefined();
  expect(getMood("arcade")?.id).toBe("arcade");
});
