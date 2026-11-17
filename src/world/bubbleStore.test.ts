import { expect, test } from "vitest";
import { lineAt, say } from "./bubbleStore";

test("he says a line for a few seconds, then stops", () => {
  say("Pick an easel!", 4, 1000);
  expect(lineAt(1000)).toBe("Pick an easel!");
  expect(lineAt(4999)).toBe("Pick an easel!");
  expect(lineAt(5000)).toBe("");
});

test("a new line replaces the last, and an empty one stops him at once", () => {
  say("One", 4, 0);
  say("Two", 4, 100);
  expect(lineAt(200)).toBe("Two");
  say("", 4, 300);
  expect(lineAt(301)).toBe("");
});
