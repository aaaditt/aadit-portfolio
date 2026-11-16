/** A way to reach Aadit. */
export type Contact = {
  id: "email" | "linkedin" | "github";
  label: string;
  /** The address or page. An empty one is not shown. */
  value: string;
};

/**
 * What the About page says. This is Aadit's own content, carried over from his earlier portfolio
 * (lib/content.js there). `sample` is for placeholder text, which must then start "A placeholder".
 */
export const ABOUT: { intro: string; facts: { label: string; text: string }[]; sample: boolean } = {
  intro: "I design and build software, end to end.",
  facts: [
    { label: "Based in", text: "Dubai, UAE" },
    { label: "Studying", text: "B.E. Computer Science at BITS Pilani Dubai, 2024 to 2028" },
    { label: "Roles", text: "Creative Executive at IEEE BITS Dubai, and freelance full-stack development and UI/UX design" },
    { label: "Outside work", text: "Badminton, played competitively since I was eight" },
  ],
  sample: false,
};

export const CONTACTS: Contact[] = [
  { id: "email", label: "Email", value: "work.aadit@gmail.com" },
  { id: "linkedin", label: "LinkedIn", value: "https://linkedin.com/in/aadit-chandra" },
  { id: "github", label: "GitHub", value: "https://github.com/aaaditt" },
];

/** The contacts that have been filled in. */
export const contactsReady = () => CONTACTS.filter((c) => c.value !== "");

/** Where a contact leads: a new message for email, its page otherwise. */
export const contactHref = (contact: Contact) => (contact.id === "email" ? `mailto:${contact.value}` : contact.value);
