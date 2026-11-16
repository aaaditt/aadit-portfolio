import { expect, test } from "vitest";
import { cue, fire } from "./overlayState";

test("firing a cue records what happened and when", () => {
  const before = performance.now();
  fire("mail-sent");
  expect(cue.kind).toBe("mail-sent");
  expect(cue.id).toBe("");
  expect(cue.at).toBeGreaterThanOrEqual(before);
  fire("sheet", "final");
  expect(cue).toMatchObject({ kind: "sheet", id: "final" });
});

test("firing nothing clears the cue", () => {
  fire("mail-sent");
  fire("");
  expect(cue.kind).toBe("");
});
