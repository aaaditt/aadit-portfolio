import { expect, test } from "vitest";
import { initialSound } from "./soundRule";

test("sound starts off unless the visitor turned it on before", () => {
  expect(initialSound(null)).toBe(false);
  expect(initialSound("off")).toBe(false);
  expect(initialSound("on")).toBe(true);
  expect(initialSound("yes please")).toBe(false);
});
