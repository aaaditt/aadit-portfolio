import { expect, test } from "vitest";
import { FLAG_SECONDS, flagTurn } from "./mailFlag";

test("the flag starts down and ends up", () => {
  expect(flagTurn(0)).toBe(0);
  expect(flagTurn(FLAG_SECONDS)).toBe(1);
  expect(flagTurn(60)).toBe(1);
});

test("it swings a little past upright on the way, never far", () => {
  let highest = 0;
  for (let t = 0; t <= FLAG_SECONDS; t += FLAG_SECONDS / 40) highest = Math.max(highest, flagTurn(t));
  expect(highest).toBeGreaterThan(1);
  expect(highest).toBeLessThan(1.25);
});

test("before the note is sent it stays down", () => expect(flagTurn(-1)).toBe(0));
