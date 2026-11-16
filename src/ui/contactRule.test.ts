import { expect, test } from "vitest";
import { MESSAGE_MAX, check, isBot, keysFrom, step } from "./contactRule";

const good = { name: "Priya", email: "priya@example.com", message: "Hello there", website: "" };

test("a complete note passes", () => expect(check(good)).toEqual({}));

test("blank or space-only fields are caught", () => {
  expect(Object.keys(check({ ...good, name: "  ", message: " \n " }))).toEqual(["name", "message"]);
});

test("an email needs an @ and a dot after it", () => {
  for (const email of ["priya", "priya@", "priya@example", "@example.com", ""]) expect(check({ ...good, email }).email, email).toBeTruthy();
});

test("spaces around an email are forgiven", () => expect(check({ ...good, email: "  priya@example.com " })).toEqual({}));

test("a message over the limit is caught, one at the limit is fine", () => {
  expect(check({ ...good, message: "a".repeat(MESSAGE_MAX) })).toEqual({});
  expect(check({ ...good, message: "a".repeat(MESSAGE_MAX + 1) }).message).toBeTruthy();
});

test("sending twice is one send", () => {
  expect(step("idle", "submit")).toBe("sending");
  expect(step("sending", "submit")).toBe("sending");
});

test("a failed send can be tried again, and editing clears the result", () => {
  expect(step("sending", "error")).toBe("failed");
  expect(step("failed", "submit")).toBe("sending");
  expect(step("sending", "ok")).toBe("sent");
  expect(step("sent", "edit")).toBe("idle");
  expect(step("failed", "edit")).toBe("idle");
});

test("typing while it sends does not cancel the send, and a late answer is ignored", () => {
  expect(step("sending", "edit")).toBe("sending");
  expect(step("idle", "ok")).toBe("idle");
  expect(step("idle", "error")).toBe("idle");
});

test("keys are all or nothing", () => {
  expect(keysFrom({})).toBeNull();
  expect(keysFrom({ service: "s", template: "t", publicKey: "" })).toBeNull();
  expect(keysFrom({ service: "s", template: "t", publicKey: "k" })).toEqual({ service: "s", template: "t", publicKey: "k" });
});

test("a filled hidden field marks a bot", () => {
  expect(isBot({ ...good, website: "x" })).toBe(true);
  expect(isBot(good)).toBe(false);
});
