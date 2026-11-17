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

/** His own words about himself, carried over from his earlier portfolio. */
export const STORY = [
  "I'm a second-year CS student based in Dubai. I play badminton, I think too much, and I care about people more than you'd expect from someone who spends this much time staring at a screen.",
  "I came to Dubai for university, for a fresh start, and somewhere between late nights and half-finished ideas I found something that felt right. Not just coding: building. There's a difference.",
  "I'm not one thing. I pick things up fast, get genuinely obsessed, build something out of it, and move to the next thing carrying everything I learned.",
];

/** A CV to hand over, as a file in /public (for example "/aadit-cv.pdf"). Empty until there is one. */
export const CV = "";

export type AskId = "who" | "where" | "done" | "earned" | "reach" | "cv";

/** A question a visitor can put to him at the camp. */
export type Ask = {
  id: AskId;
  /** The question, as written on its chip. */
  chip: string;
  /** What he says in his speech bubble: a few words. */
  says: string;
  /** The fuller answer, shown in the card. Empty when the card shows something else instead. */
  answer: string;
};

const ASKS: Ask[] = [
  { id: "who", chip: "Who are you?", says: "Pull up a log.", answer: `${STORY[0]} ${STORY[2]}` },
  { id: "where", chip: "Where are you based?", says: "Read the sign!", answer: STORY[1] },
  {
    id: "done",
    chip: "What have you done?",
    says: "It's all down there.",
    answer: "Design, code and events. Each has its own place in the valley: pick a name tag to go and look.",
  },
  {
    id: "earned",
    chip: "What have you earned?",
    says: "Come inside!",
    answer: "Every certificate has its place on the shelves inside the tent, one shelf for each kind. They are listed just below too: pick one to bring it forward.",
  },
  { id: "reach", chip: "How do I reach you?", says: "Leave me a note!", answer: "" },
  { id: "cv", chip: "Can I see your CV?", says: "It's in the tent.", answer: "" },
];

/** The questions on offer. The CV one waits until there is a CV. */
export const asks = () => ASKS.filter((a) => a.id !== "cv" || CV !== "");

/**
 * A certificate: a course, a sports award, a hackathon or event, or any other kind. Each has its
 * place on the shelves inside the camp's tent, one shelf for each kind (see trophyRule.ts).
 */
export type Credential = {
  id: string;
  title: string;
  /** Who gave it. */
  from: string;
  /** When: "2025", or "2024 to 2028, in progress". */
  when: string;
  /**
   * Its kind: "course", "sport" and "event" have objects of their own (a scroll, a medal, a
   * badge). Any other kind gets its own shelf of framed certificates, named after the kind.
   */
  kind: string;
  /** A page that proves it, such as a Coursera verify link. */
  link?: string;
  /** True for placeholders, whose title must then start "A placeholder". */
  sample?: boolean;
};

const sample = (id: string, kind: string, title: string, from: string, when: string): Credential => ({ id, kind, title: `A placeholder ${title}`, from, when, sample: true });

export const CREDENTIALS: Credential[] = [
  sample("course-1", "course", "course in interface design", "Coursera", "2025"),
  sample("course-2", "course", "course in web development", "Coursera", "2025"),
  sample("course-3", "course", "course in machine learning", "Coursera", "2025"),
  sample("course-4", "course", "course in data structures", "Coursera", "2024"),
  sample("course-5", "course", "course in databases", "Coursera", "2024"),
  sample("course-6", "course", "course in cloud computing", "Coursera", "2026"),
  sample("sport-1", "sport", "badminton tournament medal", "A sports body", "2024"),
  sample("sport-2", "sport", "badminton league award", "A sports body", "2023"),
  sample("sport-3", "sport", "inter-school sports certificate", "A school", "2022"),
  sample("event-1", "event", "hackathon participation", "A hackathon", "2025"),
  sample("event-2", "event", "hackathon finalist", "A hackathon", "2025"),
  sample("event-3", "event", "event volunteer certificate", "IEEE BITS Dubai", "2024"),
  sample("event-4", "event", "workshop certificate", "A university club", "2024"),
];

/** A club or standing role: one banner on a pole beside the stage at the Grounds. */
export type Club = {
  id: string;
  name: string;
  role: string;
  when: string;
  /** The banner's colour. */
  colour: string;
  /** True for placeholders, whose name must then start "A placeholder". */
  sample?: boolean;
};

export const CLUBS: Club[] = [
  { id: "ieee", name: "IEEE BITS Dubai", role: "Creative Executive", when: "2024 to now", colour: "#4f86c6" },
  { id: "club-2", name: "A placeholder club", role: "A role there", when: "2025", colour: "#c8553d", sample: true },
  { id: "club-3", name: "A placeholder society", role: "A role there", when: "2024", colour: "#e8c15a", sample: true },
];
