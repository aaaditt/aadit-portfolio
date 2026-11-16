import { expect, test } from "vitest";
import { isListPage } from "./listPage";

test("only the list page counts as the list page", () => {
  expect(isListPage("/work")).toBe(true);
  expect(isListPage("/work/")).toBe(true);
  expect(isListPage("/")).toBe(false);
  expect(isListPage("/workshop")).toBe(false);
  expect(isListPage("/design/work")).toBe(false);
});
