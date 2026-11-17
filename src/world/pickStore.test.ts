import { expect, test } from "vitest";
import { asked, createPick, parts } from "./pickStore";

test("picking brings one thing forward, and picking it again puts it back", () => {
  const pick = createPick();
  expect(pick.get()).toBe("");
  pick.pick("a");
  pick.pick("b");
  expect(pick.get()).toBe("b");
  pick.pick("b");
  expect(pick.get()).toBe("");
});

test("listeners hear each change once, and nothing after they leave", () => {
  const pick = createPick();
  let heard = 0;
  const stop = pick.subscribe(() => heard++);
  pick.pick("a");
  pick.clear();
  pick.clear();
  expect(heard).toBe(2);
  stop();
  pick.pick("a");
  expect(heard).toBe(2);
});

test("each kind of pick is its own: a machine part does not answer a question", () => {
  parts.pick("fetch");
  expect(asked.get()).toBe("");
  parts.clear();
});
