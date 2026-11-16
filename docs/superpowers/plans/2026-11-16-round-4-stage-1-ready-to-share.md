# Round 4, Stage 1: Ready to Share — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site safe to send to people: facts first on every project card, a working About with a contact form, a plain list page, and a link preview image.

**Architecture:** Content stays in `src/content/`, with pure helpers tested in vitest. The contact form is a small state machine in a pure file plus a client component that calls EmailJS. The form tells the world it has sent through a plain `cue` object in `overlayState.ts`, the same pattern as `highlight`; a new `MailFlag` component reads it. The plain list page switches the 3D world off by path.

**Tech Stack:** Next.js 16.4.6 (App Router, `cacheComponents`), React 19, react-three-fiber, vitest, `@emailjs/browser` (new).

**Spec:** `docs/superpowers/specs/2026-11-16-round-4-sections-design.md`

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before writing route, metadata or image code (`AGENTS.md`).
- The fact strip (title, role, outcome, year, main link) renders before any animation and never waits on it.
- A plain list of everything is one tap away from every screen.
- The world never shows a number or claim that is not in the item's data.
- Links marked `soon` are hidden, not greyed out.
- With reduced motion (`useMotion()` false) animations jump to their end state.
- Placeholders stay clearly marked as samples.
- Never put Aadit's real email or profile links in the repo until he supplies them; contact entries without a value are hidden.
- EmailJS keys come from `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`. Template params: `from_name`, `reply_to`, `message`.
- After each task: `npm test`, `npm run typecheck`, `npm run lint`. Commit and `git push origin main` (pushing deploys).

## Review Focus

1. EmailJS keys missing (the state today): the form is not shown, the direct links are, and nothing errors. → Task 3 test.
2. Send fails or the visitor is offline: the message stays in the box and a fallback is offered. → Task 3 test.
3. Send pressed twice quickly: only one email goes. → Task 3 test.
4. Message that is blank, only spaces, or very long (over 2000 characters); an email with no `@`. → Task 3 tests.
5. A project with no live links: no main link in the strip and no empty links row. → Task 1 test.

---

### Task 1: Facts first on the project card

**Files:**
- Modify: `src/content/projects.ts`, `src/content/projects.test.ts`
- Modify: `src/app/[section]/[project]/page.tsx`, `src/app/[section]/page.module.css`

**Interfaces:**
- Produces: `liveLinks(project: Project): { label: string; href: string }[]` (links without `soon`), `mainLink(project: Project): { label: string; href: string } | undefined` (the first live link).

- [ ] **Step 1: Failing tests** in `projects.test.ts`:

```ts
test("links that are not ready are left out, and the first ready one is the main link", () => {
  const base = PROJECTS[0];
  const p = { ...base, links: [{ label: "Case study", href: "/", soon: true }, { label: "Live", href: "https://example.com" }] };
  expect(liveLinks(p)).toEqual([{ label: "Live", href: "https://example.com" }]);
  expect(mainLink(p)?.label).toBe("Live");
  expect(liveLinks(base)).toEqual([]);
  expect(mainLink(base)).toBeUndefined();
});
```

- [ ] **Step 2:** Run `npm test -- projects`; expect FAIL (not exported).
- [ ] **Step 3:** Implement `liveLinks` and `mainLink` in `projects.ts`.
- [ ] **Step 4:** Reorder the card in `[project]/page.tsx`: back link, title, then a `.facts` strip (`role · year`, the outcome line, and the main link as a button if there is one), then `WorkingAt`, picture, blurb, the stats list (Team, Tools, Status), remaining live links, pager. Remove the `soon` button branch and the `.soonButton` / `.soonTag` styles. External links (`http`) use `<a target="_blank" rel="noreferrer">`.
- [ ] **Step 5:** `.facts` in `page.module.css`: reuse the `.outcome` look (accent left border, `--panel-hover` background); role and year in the mono uppercase style of `.where`.
- [ ] **Step 6:** `npm test`, typecheck, lint pass. Commit `feat: facts first on the project card`.

### Task 2: About gets its own page and content

**Files:**
- Create: `src/content/about.ts`, `src/content/about.test.ts`, `src/app/about/page.tsx`
- Modify: `src/app/[section]/page.tsx` (drop About from `generateStaticParams`, remove the `.soon` branch), `src/app/[section]/[project]/page.tsx` (remove the `__none__` param), `src/app/[section]/page.module.css`

**Interfaces:**
- Produces:

```ts
export type Contact = { id: "email" | "linkedin" | "github"; label: string; /** Empty until Aadit supplies it. */ value: string };
export const ABOUT: { intro: string; facts: { label: string; text: string }[]; sample: boolean };
export const CONTACTS: Contact[];
/** Contacts that have a value. */
export function contactsReady(): Contact[];
/** Where a contact leads: mailto: for email, the value itself otherwise. */
export function contactHref(c: Contact): string;
```

- [ ] **Step 1: Failing tests** in `about.test.ts`: `ABOUT.intro` is non-empty; `facts` has 3 to 5 entries; when `ABOUT.sample` is true every fact text starts with "A placeholder"; `contactsReady()` returns only contacts whose `value` is non-empty; `contactHref({id:"email",label:"Email",value:"a@b.co"})` is `"mailto:a@b.co"` and a linkedin value passes through unchanged.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Write `about.ts`. Placeholder facts: "Based in", "Studying", "Looking for", "Outside work". All three contacts present with `value: ""`.
- [ ] **Step 4:** `src/app/about/page.tsx`: a static route (it wins over `[section]`). Exports `metadata = { title: "About & contact" }`. Renders `<Card>` with the Home back link, the section title from `getSection("about")`, the intro, the facts as a `<dl>` reusing `.stats`, a "Sample" note when `ABOUT.sample`, then `<Contact />` from Task 3 (stub it as the ready links list until Task 3 lands).
- [ ] **Step 5:** In `[section]/page.tsx` filter `generateStaticParams` to sections that are neither `home` nor `about`; delete the "coming soon" branch and `.soon` style. In `[project]/page.tsx` return `projectsIn(section).map(...)` directly.
- [ ] **Step 6:** `npm run build` succeeds and lists `/about` once. Tests, typecheck, lint pass. Commit `feat: About has its own page and content`.

### Task 3: Contact form through EmailJS

**Files:**
- Create: `src/ui/contactRule.ts`, `src/ui/contactRule.test.ts`, `src/ui/Contact.tsx`, `src/ui/Contact.module.css`
- Modify: `src/app/about/page.tsx`, `package.json` (add `@emailjs/browser`)

**Interfaces:**
- Consumes: `contactsReady`, `contactHref` (Task 2); `cue` (Task 4 adds it; until then the form skips the world signal).
- Produces, in `contactRule.ts`:

```ts
export const MESSAGE_MAX = 2000;
export type Fields = { name: string; email: string; message: string; /** Hidden field; people leave it empty. */ website: string };
export type Errors = Partial<Record<"name" | "email" | "message", string>>;
export function check(fields: Fields): Errors;
export type Status = "idle" | "sending" | "sent" | "failed";
export type Event = "submit" | "ok" | "error" | "edit";
export function step(status: Status, event: Event): Status;
export type Keys = { service: string; template: string; publicKey: string };
/** The keys if all three are set, otherwise null. */
export function keysFrom(env: Record<string, string | undefined>): Keys | null;
/** True when the hidden field was filled: pretend to send, send nothing. */
export function isBot(fields: Fields): boolean;
```

- [ ] **Step 1: Failing tests** in `contactRule.test.ts`:

```ts
const good = { name: "Priya", email: "priya@example.com", message: "Hello there", website: "" };
test("a complete note passes", () => expect(check(good)).toEqual({}));
test("blank or space-only fields are caught", () => {
  expect(Object.keys(check({ ...good, name: "  ", message: " \n " }))).toEqual(["name", "message"]);
});
test("an email needs an @ and a dot after it", () => {
  for (const email of ["priya", "priya@", "priya@example", "@example.com"]) expect(check({ ...good, email }).email).toBeTruthy();
});
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
test("keys are all or nothing", () => {
  expect(keysFrom({})).toBeNull();
  expect(keysFrom({ NEXT_PUBLIC_EMAILJS_SERVICE_ID: "s", NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: "t" })).toBeNull();
  expect(keysFrom({ NEXT_PUBLIC_EMAILJS_SERVICE_ID: "s", NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: "t", NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: "k" })).toEqual({ service: "s", template: "t", publicKey: "k" });
});
test("a filled hidden field marks a bot", () => expect(isBot({ ...good, website: "x" })).toBe(true));
```

- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement `contactRule.ts`.
- [ ] **Step 4:** `npm install @emailjs/browser`; read its README in `node_modules` for the current `send` signature before using it.
- [ ] **Step 5:** `Contact.tsx` (client). Always shows the ready contact links; the email row is a "Copy email" button (clipboard, falling back to the `mailto:` link if the clipboard API throws). If `keysFrom` gives keys, shows the form: name, email, message (with `maxLength`), the hidden `website` field (off-screen, `tabIndex={-1}`, `autoComplete="off"`), and a Send button. `process.env.NEXT_PUBLIC_*` must be read as literal property accesses so they are inlined. On submit: `check`; if errors, show them under each field with `aria-describedby`; else `step(..., "submit")`, and unless `isBot`, call EmailJS with `{ from_name, reply_to, message }`. On success show "Sent. Thanks, {name}!" in a `role="status"` line and clear the message; on error keep every field, show "That did not send." with the ready email link. The button is disabled while `sending`.
- [ ] **Step 6:** Use `<Contact />` in `about/page.tsx`. With no keys and no contact values, the section shows "Contact details are on their way." so the page is never empty.
- [ ] **Step 7:** Tests, typecheck, lint, build pass. Commit `feat: contact form through EmailJS`.

### Task 4: The mailbox flag answers

**Files:**
- Modify: `src/world/overlayState.ts`, `src/world/voxel/models.ts` (take the gold flag box out of `camp()`, export it as `mailFlag(): Box[]` modelled around its hinge at the origin), `src/world/voxel/Animated.tsx` (add `MailFlag`), the scene file that mounts `CodeSign` (mount `MailFlag` beside it), `src/ui/Contact.tsx`
- Test: `src/world/voxel/world.test.ts` if it counts camp boxes

**Interfaces:**
- Produces: in `overlayState.ts`, `export const cue = { kind: "", id: "", at: 0 }` and `export function fire(kind: string, id = ""): void` (sets the fields, `at = performance.now()`). Stage 2 reuses both.
- `MailFlag`: placed at the lookout plateau plus the flag's old offset `(-3.75, 1.7, 3.4)`. Lies flat by default; when `cue.kind === "mail-sent"` it swings up 90° over 0.4 s with a small overshoot and stays up until the page is left. Reduced motion: jumps up.

- [ ] **Step 1:** Add `cue` and `fire`; move the flag box; add `MailFlag`; mount it.
- [ ] **Step 2:** In `Contact.tsx`, on a successful send call `fire("mail-sent")` and `sfx.chime()`; on leaving the About page (component unmount) call `fire("")`.
- [ ] **Step 3:** Tests, typecheck, lint pass. Check in the browser: the flag is down on arrival and up after a send (use the capture method in the project's notes). Commit `feat: the mailbox flag goes up when a note is sent`.

### Task 5: A plain list page

**Files:**
- Create: `src/app/work/page.tsx`, `src/app/work/page.module.css`, `src/ui/ListLink.tsx` (+ css module)
- Modify: `src/world/World.tsx`, `src/ui/IntroOverlay.tsx`, `src/app/layout.tsx`

**Interfaces:**
- Consumes: `PROJECTS`, `projectsIn`, `liveLinks`, `SECTIONS`, `ABOUT`, `contactsReady`, `contactHref`.

- [ ] **Step 1:** `work/page.tsx`: `metadata = { title: "Everything on one page" }`. An opaque, scrollable page on `--panel`: name and one-line blurb, the About intro and ready contacts, then one heading per work section with each project as title, `role · year · status`, outcome, live links, and a "Sample" tag where set. Semantic headings and lists only; no client code.
- [ ] **Step 2:** `World.tsx`: return `null` when the path is `/work`, so the 3D bundle is never loaded there.
- [ ] **Step 3:** `IntroOverlay.tsx`: when the path is `/work` and the intro is `pending`, call `intro.finish()` at once instead of waiting 8 seconds.
- [ ] **Step 4:** `ListLink.tsx` (client, reads the path): a small fixed link in the top right, "List view" → `/work`; on `/work` it reads "Back to the world" → `/`. Mount it in `layout.tsx` inside a `Suspense`. It must not overlap the card or the reset-view button on a 360-pixel-wide screen.
- [ ] **Step 5:** Build passes and lists `/work`. In the browser: `/work` shows with no canvas element and no loading cover; the link is visible on Home, a section, a project and About. Commit `feat: a plain list of everything`.

### Task 6: Link preview image

**Files:**
- Create: `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx` (re-exports the same)
- Modify: `src/app/layout.tsx`, `src/ui/pixelArt.tsx` (export `LETTERS`)

- [ ] **Step 1:** Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` and the `ImageResponse` page it links to.
- [ ] **Step 2:** `opengraph-image.tsx`: exports `alt = "Aadit's portfolio: a small pixel world"`, `size = { width: 1200, height: 630 }`, `contentType = "image/png"`. Draws a day-sky gradient, a band of grass along the bottom, the name AADIT built from `LETTERS` as square `div`s (every `div` with children needs `display: flex`), and the line "Design, code and events, in a small pixel world." No font files.
- [ ] **Step 3:** In `layout.tsx` add `metadataBase: new URL("https://aadit-portfolio-one.vercel.app")`, and `openGraph` / `twitter` (`card: "summary_large_image"`) entries carrying the title and description.
- [ ] **Step 4:** Build passes. Open `/opengraph-image` on the dev server and look at it; check the page head carries `og:image` and `twitter:image`. Commit `feat: a picture for link previews`.

### Task 7: Stage check

- [ ] **Step 1:** Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] **Step 2:** Capture Home, a project card, About and `/work` at desktop and 390-pixel widths, day and night. Check: facts readable at once; no greyed links; nothing overlaps on the phone.
- [ ] **Step 3:** Update the Status line in the spec and the round-3 memory; push. Report to Aadit what he needs to supply: EmailJS keys (also in Vercel's environment variables), email and profile links, bio text.
