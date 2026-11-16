import { expect, test } from "vitest";
import { initialTheme } from "./themeRule";

test("a saved choice wins over the device setting", () => {
  expect(initialTheme("night", false)).toBe("night");
  expect(initialTheme("day", true)).toBe("day");
});

test("with nothing saved, the device setting decides", () => {
  expect(initialTheme(null, true)).toBe("night");
  expect(initialTheme(null, false)).toBe("day");
});

test("a saved value that makes no sense is ignored", () => {
  expect(initialTheme("purple", false)).toBe("day");
  expect(initialTheme("", true)).toBe("night");
});
