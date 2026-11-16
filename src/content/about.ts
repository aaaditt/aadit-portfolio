/** A way to reach Aadit. */
export type Contact = {
  id: "email" | "linkedin" | "github";
  label: string;
  /** The address or page. Empty until it is supplied; an empty one is not shown. */
  value: string;
};

/**
 * What the About page says. These are placeholders: replace the text with the real thing and
 * set `sample` to false.
 */
export const ABOUT: { intro: string; facts: { label: string; text: string }[]; sample: boolean } = {
  intro: "I design things, build them, and run events that bring people together.",
  facts: [
    { label: "Based in", text: "A placeholder for where I live and work." },
    { label: "Studying", text: "A placeholder for my course and college." },
    { label: "Looking for", text: "A placeholder for the kind of role or project I want next." },
    { label: "Outside work", text: "A placeholder for what I do when I am not making things." },
  ],
  sample: true,
};

/** Fill in each `value` to make it appear on the About page and the list page. */
export const CONTACTS: Contact[] = [
  { id: "email", label: "Email", value: "" },
  { id: "linkedin", label: "LinkedIn", value: "" },
  { id: "github", label: "GitHub", value: "" },
];

/** The contacts that have been filled in. */
export const contactsReady = () => CONTACTS.filter((c) => c.value !== "");

/** Where a contact leads: a new message for email, its page otherwise. */
export const contactHref = (contact: Contact) => (contact.id === "email" ? `mailto:${contact.value}` : contact.value);
