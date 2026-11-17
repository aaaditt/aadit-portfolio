import { expect, test } from "vitest";
import { BEAM_GAP, RISE_SECONDS, beamHeight, beamRise, beams, countLine } from "./valleyRule";

test("one beam for each place he has work in, plus one for his clubs, each leading to its place", () => {
  const list = beams();
  expect(list.map((b) => b.id)).toEqual(["design", "code", "events", "clubs"]);
  for (const b of list) expect(b.href).toMatch(/^\/(design|code|events)$/);
  expect(list.find((b) => b.id === "clubs")!.href).toBe("/events");
});

test("each beam's tag says how many there really are, from the data, in words", () => {
  expect(countLine(1, "project")).toBe("1 project");
  expect(countLine(3, "project")).toBe("3 projects");
  for (const b of beams()) expect(b.line).toMatch(/^\d+ \w+/);
  // The clubs beam also carries his standing role.
  expect(beams().find((b) => b.id === "clubs")!.role).toMatch(/IEEE/);
});

test("more work means a taller beam, within limits", () => {
  expect(beamHeight(6)).toBeGreaterThan(beamHeight(3));
  expect(beamHeight(0)).toBeGreaterThan(0);
  expect(beamHeight(500)).toBe(beamHeight(40));
});

test("the beams rise one after another, quickly, and stay up", () => {
  expect(beamRise(0, 0)).toBe(0);
  expect(beamRise(1, BEAM_GAP * 0.5)).toBe(0);
  expect(beamRise(0, RISE_SECONDS)).toBe(1);
  expect(beamRise(3, 3 * BEAM_GAP + RISE_SECONDS)).toBe(1);
  expect(3 * BEAM_GAP + RISE_SECONDS).toBeLessThan(1.5);
  expect(beamRise(2, 0, true)).toBe(1);
});
