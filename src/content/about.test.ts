import { expect, test } from "vitest";
import { ABOUT, CLUBS, CONTACTS, CREDENTIALS, CV, asks, contactHref, contactsReady } from "./about";

test("the About page has an opening line and a handful of facts", () => {
  expect(ABOUT.intro.length).toBeGreaterThan(10);
  expect(ABOUT.facts.length).toBeGreaterThanOrEqual(3);
  expect(ABOUT.facts.length).toBeLessThanOrEqual(5);
  for (const fact of ABOUT.facts) expect(fact.label.length).toBeGreaterThan(0);
});

test("placeholder facts say that they are placeholders", () => {
  if (!ABOUT.sample) return;
  for (const fact of ABOUT.facts) expect(fact.text, fact.label).toMatch(/^A placeholder/);
});

test("only contacts that have been filled in are offered", () => {
  for (const contact of contactsReady()) expect(contact.value.length).toBeGreaterThan(0);
  expect(contactsReady()).toHaveLength(CONTACTS.filter((c) => c.value !== "").length);
});

test("email leads to a new message, other contacts to their page", () => {
  expect(contactHref({ id: "email", label: "Email", value: "a@b.co" })).toBe("mailto:a@b.co");
  expect(contactHref({ id: "linkedin", label: "LinkedIn", value: "https://www.linkedin.com/in/x" })).toBe("https://www.linkedin.com/in/x");
});

test("each question has a few words for his bubble, and either a full answer or a part of the card that answers it", () => {
  const list = asks();
  expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
  for (const a of list) {
    expect(a.chip, a.id).toMatch(/\?$/);
    expect(a.says.length, a.id).toBeGreaterThan(3);
    // Short enough for a speech bubble.
    expect(a.says.length, a.id).toBeLessThanOrEqual(24);
    if (!["study", "reach", "cv"].includes(a.id)) expect(a.answer.length, a.id).toBeGreaterThan(20);
  }
});

test("the CV is only offered once there is one", () => {
  expect(asks().some((a) => a.id === "cv")).toBe(CV !== "");
});

test("courses and clubs have unique names to pick them by, and placeholders say what they are", () => {
  expect(new Set(CREDENTIALS.map((c) => c.id)).size).toBe(CREDENTIALS.length);
  expect(new Set(CLUBS.map((c) => c.id)).size).toBe(CLUBS.length);
  for (const c of CREDENTIALS) if (c.sample) expect(c.title, c.id).toMatch(/^A placeholder/);
  for (const c of CLUBS) {
    if (c.sample) expect(c.name, c.id).toMatch(/^A placeholder/);
    expect(c.colour, c.id).toMatch(/^#[0-9a-f]{6}$/i);
  }
  // Few enough to hang on one line, or stand in one row.
  expect(CREDENTIALS.length).toBeLessThanOrEqual(8);
  expect(CLUBS.length).toBeLessThanOrEqual(4);
});
