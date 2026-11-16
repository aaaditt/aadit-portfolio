# Round 4: make each place show its content as well as the home page does

## Status

Stage 1 (ready to share) built and pushed on 2026-11-16. Stage 2 (the Light Table for one project, Brand refresh) built on 2026-11-17, with one critic round acted on; it waits for Aadit's verdict before stage 3.

How the Light Table turned out, where it differs from the text below: the sheets fan out above the easel like a hand of cards, each on a thread of light, instead of lifting off a table. A picked sheet is held up large beside him, draws itself again, and is named by a caption on the page pinned to it. The selection lives in `src/world/sheetStore.ts` (it is state both sides set, so not a one-off cue).

## Context

The home page is strong: an opening flight, music, day and night. The section and project pages are not. All three sections are the same card with a different colour, what the character does at an exhibit is random and unrelated to the project, nothing happens on arrival, and About says "coming soon". Aadit's words: "the character is doing something on the side but that is just not it."

Aadit is about to share the site. He wants the display format mastered with placeholders first, then real content. He has real material for events he ran, clubs and roles, and courses and certificates. He has few games and no writing.

Ideas came from a three-agent round (a free creative, a code-grounded brainstormer, a critic). Aadit then chose the picks below.

## Decisions Aadit made

- Keep all four signature ideas: Light Table (Design), Open the Hood (Code), the Grounds (replaces the Arcade), the camp answers (About).
- Courses and certificates are a lantern line at the About camp. No fifth building. The bar stays at five: Home, Design, Code, Events, About.
- Contact is a form sent through EmailJS, and on send he throws a paper plane that lands in the mailbox.

## The one rule

Whatever the visitor picks in the card, the place builds that exact thing out of itself from the item's own data, he operates it, and it packs away on leaving. Any later idea that does not follow this is refused.

Four guard rules (from the critic, adopted as my call):
1. The fact strip (title, role, outcome, year, main link) renders before any animation and never waits on it.
2. Every show runs once, lasts under about three seconds, and any tap interrupts it.
3. A plain list of everything is one tap away from every screen.
4. The world never shows a number or claim that is not in the item's data.

## Approaches considered

- **A. Redesign the card only.** Cheap and safe, but leaves the world as decoration. Rejected: it does not answer the brief.
- **B. One signature show per place, driven by per-item data (chosen).** Each place gets its own behaviour, placeholders can run the full show, and real work drops in as data.
- **C. Big cross-cutting showpieces first** (a year slider that rebuilds the island, live data from GitHub). Rejected for now: very costly, and needs real data that placeholders cannot stand in for.

## Design

### Shared foundations

- **Show data.** `Project` in `src/content/projects.ts` gains an optional `show` field, shaped by section:
  - design: `sheets: { label, note, image? }[]` (sketch, wireframe, palette, final)
  - code: `parts: { label, note }[]` and `result: string`
  - events: `attendance: number`, plus the existing role
  Missing `show` falls back to today's loops in `src/world/voxel/workLoop.ts`. Keep three items per work section, so `projectFor` / `exhibitFor` / `whereIs` keep working.
- **Lists that are not exhibits.** New `src/content/about.ts` holds the bio answers, contact links, `CLUBS` and `CREDENTIALS`. These can be any length and do not use the three-exhibit rule.
- **Cue store.** Extend `src/world/overlayState.ts` (same plain-object pattern as `highlight`) with `cue = { kind, id, at }`. Card chips write it; world components read it per frame. This is how card and world become one thing.
- **Speech bubble text.** `src/ui/SpeechBubble.tsx` reads its line from a small store, so he can say a per-page line, an answer, or "Thanks, <name>!".
- **Fact strip card.** `src/app/[section]/[project]/page.tsx`: title, role, outcome, year and main link at the top; story and stats below; links marked `soon` are hidden; one lead item per section shown larger in `src/ui/Inventory.tsx`.
- **Moving parts.** Buildings are single static batches in `src/world/voxel/models.ts`. Parts that move (roof, sheets, flag, tent flap, stage lights) are split into their own components, as `CodeSign` in `Animated.tsx` already does.
- **Phones.** The peek height of `src/ui/Card.tsx` and the phone camera framing in `src/world/CameraRig.tsx` are set so each show is visible above the sheet. Chips live in the peek area.
- **Reduced motion.** With motion off, shows jump to their end state.

### Design: the Light Table

Opening a project lifts a stack of flat sheets off a table and fans them apart in depth. He steps along and points at the front sheet; the final lands on the easel. Process chips in the card bring each sheet forward. It plays once on arrival. The paint buckets take the project's three colours and the card shows them as swatches. Placeholder sheets are generated: a scribble, grey boxes, swatches, the pixel thumbnail from `src/ui/ProjectThumb.tsx`.

### Code: Open the Hood

- First, the cheap version: the lab's glowing wall lists the three projects (one line each, lit on hover via `highlight`), and the terminal loop ends on the project's `result` line instead of a generic "passed" bar.
- Then the full version: the roof lifts on the section page to show three machines with name plates. Opening one runs it: a row of 3 to 5 generic blocks from `parts`, he pulls a lever, a glowing packet runs through, the last block shows `result`. Part chips in the card light a block and show its note. Machines are generated from data, never hand-modelled per project.

### Events: the Grounds (replaces the Arcade)

Section id and route change from `play` to `events`, with a redirect from `/play`. The tent, stage, lights and bunting stay; the cabinets go and the three exhibits become event carts (a new exhibit kind). Opening an event unpacks its cart: stalls pop up, stage lights chase, a crowd walks in (instanced villagers, capped at about 40) and he takes the mic. A counter shows the real `attendance`. Closing packs it away. Clubs and roles are banners on poles beside the stage; picking one in the card raises it and he salutes.

### About: the camp answers, lanterns, and contact

About gets its own page (no longer the generic section page, which also removes the `__none__` placeholder param) and its own stand and greeting, separate from Home.

- **Questions.** He sits on the log and the fire catches. Chips in the card: who are you, where are you based, what have you done, how do I reach you, CV. Each sends him to a prop: signpost arms swing out with facts; he points across the valley and each building's name tag lights (reusing the `mapLabels` projection); the tent flap opens for the CV. Short answer in the bubble, full answer in the card.
- **Lantern Line.** A string of lanterns from tent to signpost, one per entry in `CREDENTIALS`. Opening the Study part makes him walk the line lighting them; in-progress ones stay dim. Picking a row lifts its lantern. Lit lanterns show from Home at night (`src/world/daylight.ts`).
- **Contact.** "How do I reach you?" opens a form: name, their email, message. Direct links (copy email, LinkedIn, GitHub) stay visible beside it. Sending uses `@emailjs/browser`. On send he folds the note into a paper plane and throws it; it loops over the valley while the request is in flight, and lands in the mailbox with the flag up and a chime only when EmailJS confirms. On failure he catches it and looks sheepish, the message stays in the box, and the card offers the address to copy. A hidden honeypot field guards against bots. The camera stays at the camp.

### Not doing

Year slider, red string between projects, travel vehicles, live weather, guestbook, postcard, greenhouse, anything built on writing or games, a fifth building. The music gaining an instrument per district is kept as a possible later showpiece.

## Build order

Each stage ends with Aadit looking at it before the next begins, and is committed and pushed (pushing deploys).

1. **Ready to share.** Fact strip card, hidden "Soon" links, About as its own page with placeholder bio and contact links, the EmailJS form with a plain confirmation and mailbox flag, a plain `/work` list page, a link preview image.
2. **Proof slice.** Cue store, show data, and the Light Table for one Design project, on desktop and phone. If this does not land, stop and rethink before building more.
3. **Roll out.** Light Table for all Design projects, bubble text store, the cheap Code version, lead items.
4. **The camp.** Question chips and prop actions, the Lantern Line, the paper plane.
5. **The Grounds.** Rename `play` to `events`, carts, the pop-up show, club banners.
6. **Open the Hood.** Roof lift and machines.
7. **Finish.** Phone and reduced-motion pass, a critic round, then real content.

## Files that change most

- Content: `src/content/projects.ts`, `src/content/sections.ts`, new `src/content/about.ts`
- Pages: `src/app/[section]/page.tsx`, `src/app/[section]/[project]/page.tsx`, new About and `/work` routes
- UI: `src/ui/Card.tsx`, `src/ui/Inventory.tsx`, `src/ui/SpeechBubble.tsx`, `src/ui/BottomBar.tsx`
- World: `src/world/overlayState.ts`, `src/world/voxel/Work.tsx`, `workLoop.ts`, `Exhibits.tsx`, `exhibitData.ts`, `models.ts`, `routes.ts`, `Animated.tsx`, `src/world/Hotspots.tsx`, `src/world/CameraRig.tsx`
- Closed types to widen for the rename and new exhibit kind: `SectionId`, `WorkSection`, `Exhibit.kind`, `KIND_NAMES`, and the per-kind tables in `Work.tsx` and `routes.ts`

## First steps on approval

1. Save this design to `docs/superpowers/specs/2026-11-16-round-4-sections-design.md` and commit it.
2. Write the detailed plan for stage 1 only (superpowers:writing-plans); later stages get their plans as they come up, since stage 2 may change them.
3. Read the relevant guides in `node_modules/next/dist/docs/` before touching routes or metadata (per `AGENTS.md`).

## Needed from Aadit

- An EmailJS account with a service and a template; the public key, service ID and template ID.
- The email address and profile links to show. Placeholder bio text is fine for now.

## Verification

- Run the existing tests, lint and a production build after each stage; add tests for new pure logic (show timelines in `workLoop.ts`, content lookups, the contact form's state machine).
- Run the dev server and capture each place at desktop and phone widths, in day and night, following the project's capture notes. Check that the fact strip is readable before any show finishes, and that a tap interrupts a show.
- Send a real test message through EmailJS and confirm it arrives; force a failure and confirm the message is kept and the fallback address shows.
- Check `/play` redirects to `/events` after stage 5.
- After stages 2 and 7, run a critic agent on screenshots and act on its advice.
