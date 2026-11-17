# Start here (for a new session)

Aadit's portfolio is a voxel valley in the browser. It is live at https://aadit-portfolio-one.vercel.app, and every push to `main` deploys.

## Where things stand (2026-11-17)

- **Round 4: done.** Every place builds a show from the open item's data:
  - Design: sheets fanned above the easel (the Light Table);
  - Code: a machine of the project's parts;
  - Events: a fair with a crowd and stalls;
  - About: questions answered round the camp, a trophy tent for certificates, and a contact note that flies to the mailbox as a paper plane.
- **Round 5: items 1 and 2 done.**
  - Item 1, the Stage: the world goes dark around an open show.
  - Item 2, "light the valley": beams over each place.
  - Design: `docs/superpowers/specs/2026-11-17-round-5-wow-design.md`.
- **Next: round 5, items 3 to 6.** Plan: `docs/superpowers/plans/2026-11-17-round-5-items-3-to-6.md`. Item 3, the Design Lightbox, is first.
- **Almost all content is still placeholder.** What is real: the About facts, the contact links, the IEEE BITS Dubai role, and the BITS Pilani degree.

## Waiting on Aadit

- One real design project with four stage images, for item 3.
- One real event with its true turnout, for item 4.
- One real build split into parts, for item 5.
- Real certificates (10–20, with kinds and verify links), clubs, and the CV file.
- EmailJS keys, so the contact form shows.

## How Aadit likes to work

- **Commits.** Commit and push after every meaningful change.
- **Critic rounds.** Run a critic subagent on design work and act on what it says, in rounds until it signs off.
- **One step at a time.** Each stage or item ends with Aadit looking at it before the next begins. A "go ahead" covers the step asked about, not everything after it.
- **Plain words.** Explain plainly. He is a CS student and designer.

## Running and checking

| Task | Command |
|---|---|
| Dev | `npm run dev -- --port 3210` (it can degrade after hours) |
| Production check | `npm run build`, then `npx next start --port 3217` |
| Checks | `npm test`, `npm run typecheck`, `npm run lint` |

- **Before restarting a server**, stop the old one by its PID: `netstat -ano | grep ":3217 "`, then `taskkill //PID <pid> //F`.
- **Next.js 16** with Cache Components: read `node_modules/next/dist/docs/` before touching routes or metadata (see AGENTS.md).

## Map of the code

| Area | Files |
|---|---|
| Content | `src/content/projects.ts`, `about.ts`, `sections.ts` |
| Pages | `src/app/` (`[section]`, `[section]/[project]`, `about`, `work` for the plain list) |
| Card UI | `src/ui/` (`Sheets.tsx`, `Asks.tsx`, `Contact.tsx`, `ValleyTags.tsx`, `DoorFade.tsx`) |
| World | `src/world/`: the camera in `CameraRig.tsx` (opening flight, section views, landing), light in `DayNight.tsx`, the Stage in `stageRule.ts`, `stageStore.ts` and `show/Stage.tsx` |
| Shows | `src/world/show/` (each with a tested `*Rule.ts`) and `src/world/voxel/LightTable.tsx` |
| Models | `src/world/voxel/models.ts`, terrain in `terrain.ts`, routes in `routes.ts`, the character in `Character.tsx` |
| Shared stores | `overlayState.ts` (`cue`, `caption`, `mailbox`), `pickStore.ts`, `sheetStore.ts`, `tentStore.ts`, `bubbleStore.ts` |
