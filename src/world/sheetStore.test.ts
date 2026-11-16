import { expect, test } from "vitest";
import { sheets } from "./sheetStore";

test("picking a sheet brings it forward, and picking it again puts it back", () => {
  sheets.clear();
  expect(sheets.front()).toBe("");
  sheets.pick("sketch");
  expect(sheets.front()).toBe("sketch");
  sheets.pick("final");
  expect(sheets.front()).toBe("final");
  sheets.pick("final");
  expect(sheets.front()).toBe("");
});

test("the page hears about it when the world picks one, and stops hearing when it leaves", () => {
  sheets.clear();
  let heard = 0;
  const stop = sheets.subscribe(() => heard++);
  sheets.pick("palette");
  sheets.clear();
  sheets.clear();
  expect(heard).toBe(2);
  stop();
  sheets.pick("palette");
  expect(heard).toBe(2);
  sheets.clear();
});
