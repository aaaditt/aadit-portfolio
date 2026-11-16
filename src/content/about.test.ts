import { expect, test } from "vitest";
import { ABOUT, CONTACTS, contactHref, contactsReady } from "./about";

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
