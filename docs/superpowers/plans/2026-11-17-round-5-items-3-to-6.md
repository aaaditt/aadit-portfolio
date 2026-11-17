# Round 5, items 3 to 6: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Aadit has used inline execution all along). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Finish round 5. In order:
- **Item 3:** the Design Lightbox.
- **Item 4:** the Events walk-in and polaroid.
- **Item 5:** the Code lab unfolding into a diagram.
- **Item 6:** the impact kit.

**Architecture:** Each item follows the project's existing pattern:
- a pure, tested `*Rule.ts` holds the timings and layout;
- a react-three-fiber component reads it every frame;
- a shared plain-object store links the card and the world.

Every item runs on top of the Stage (`src/world/stageStore.ts`), which already dims the world and frames the show.

**Tech stack:** Next.js 16 (read `node_modules/next/dist/docs/` before touching routes; see AGENTS.md), react-three-fiber, three 0.187, vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-round-5-wow-design.md`. Read its Status, Rule and Items sections first.

## Before starting

- **Content gate.** Each item needs one real piece of content from Aadit; the spec's last table lists what. Ask for it at the start of the item. Placeholder content cannot pass the item's "done when". The mechanics may be built on placeholders, but say plainly that they are not signed off.
- **One item at a time.** Each item ends with:
  1. screenshots (desktop 1360×800 and phone 390×844, day and night);
  2. a critic subagent round, acting on what it says;
  3. commit and `git push origin main` (pushing deploys to https://aadit-portfolio-one.vercel.app);
  4. Aadit's look before the next item.
- **Checking.** Use the production build: run `npm run build`, then `npx next start --port 3217`. Before restarting, stop the old server by its PID:

  ```bash
  netstat -ano | grep ":3217 "
  taskkill //PID <pid> //F
  ```

  Capture with Playwright, waiting inside one call. A frame strip comes from drawing the `<canvas>` into a 2D canvas inside `requestAnimationFrame` and returning a JPEG data URL; decode it with Python. Keep capture scripts out of the repo when done, because lint picks up `.playwright-mcp/*.js`.
- **Checks per item:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Global constraints

- **Placeholder copy.** Placeholder text starts "A placeholder", and the item is marked `sample: true`.
- **Every show:**
  - runs once, in under about 3 s;
  - can be interrupted by any tap;
  - jumps to its end state with reduced motion (`useMotion()`);
  - packs away when its item closes.
- **The world** never shows a number or claim that is not in the item's data.
- **The card** stays readable, and nothing in the world repeats it (the Stage hides pinned captions).
- **Hit boxes** in the world respect `wasDrag()` and `intro.get() !== "done"`, as every existing one does.
- **Frame rate.** 60 fps on this laptop: sample `requestAnimationFrame` intervals during a show, and expect a median of about 16.7 ms.
- **Commit messages** end with the attribution lines in the session's system reminder.

## Review focus

1. **No real image yet.** A design project without stage images falls back to the generated sheet art (`sheetArt`), and the Lightbox still works.
2. **Drag versus turning the view.** Dragging the sheet must not also turn the camera (`src/world/OrbitInput.tsx` listens on the canvas). A touch drag on a phone must scrub, not scroll.
3. **Turnouts.** An event with a turnout of 0, 1, 40, 41 or 5,000 gets the right number of figures plus a "+N" tile, and a turnout that is not a whole number is rejected by the content test.
4. **A part name too long for a room.** It is cut short in the world, and shown in full in the card.
5. **Leaving mid-show.** Opening another item or leaving the page during any show leaves no frozen frame, shake, freeze or pinned label behind.

---

### Task 3: Design, the Lightbox

**Files:**
- Modify `src/content/projects.ts`: `Sheet` gains `image?: string` (a path in `/public`) and `weeks?: number`.
- Create `src/world/show/lightboxRule.ts` and `lightboxRule.test.ts`.
- Modify `src/world/voxel/LightTable.tsx`, or replace its hero sheet with a new `src/world/show/Lightbox.tsx` mounted in `src/world/voxel/Exhibits.tsx` where `LightTable` is now.
- Modify `src/world/voxel/sheets.ts` only if the fan's poses change.
- Modify `src/ui/Sheets.tsx`: the chips follow the scrub. The store is already `sheets` in `src/world/sheetStore.ts`.
- Modify `src/world/OrbitInput.tsx`: ignore a pointer that the sheet captured.

**Interfaces (`lightboxRule.ts`):**
- **`riseAt(i, n, since, still?)`** returns `{ y: number; size: number; done: boolean }` for voxel `i` of `n` (about 60).
  - The wave starts at the easel, and voxel `i` sets off `i * 0.012` s after the one before.
  - All are in by 1.0 s.
- **`HERO`**: the sheet's size in units. It is at least 3× his height of about 3.4, so at least 10.2 tall.
- **`planeOffset(stage, n, pull)`** returns `{ x: number; z: number }`.
  - `pull` runs from 0 (shut) to 1 (fully apart).
  - The planes spread along x in stage order, 1.2 units apart at `pull` 1.
- **`snapTo(pull, n)`** returns the nearest stage index for a scrub position.
- **`peekAt(since)`**: the discovery peel, a turn in radians. It is 0 before 0.6 s, peaks at 15° (0.26 rad), and springs back by about 1.2 s.

**Steps:**
- [ ] Write the tests, in `lightboxRule.test.ts`:
  - the rise finishes by 1.0 s, and with `still` every voxel is in at once;
  - `planeOffset` keeps the planes in stage order, and no two are closer than 1.0 apart at `pull` 1;
  - `snapTo` rounds to the nearest stage and clamps at both ends;
  - `peekAt` is 0 at 0.5 s, about 0.26 at its peak, and back under 0.01 by 1.3 s.
- [ ] Run `npx vitest run src/world/show/lightboxRule.test.ts` and expect a FAIL (module not found). Implement, then run again and expect a PASS.
- [ ] Build the component:
  - **Rise.** Voxels rise from the meadow in front of the easel and become the sheet. Use an InstancedMesh of 60 boxes and move them from the ground to the sheet's grid.
  - **Image.** The sheet face shows the picked stage's `image` as a pixelated texture (`NearestFilter`), or `sheetArt` when there is none.
  - **Camera.** The Stage frames it. If the hero is too tall for the Stage's framing, add an easel case to `SHOW_AT` in `src/world/show/Stage.tsx`.
- [ ] Scrub: a pointer down on the sheet sets a flag in a new store that OrbitInput checks before turning the view. A horizontal drag maps to `pull`; release calls `snapTo`, then `sheets.pick(kind)`, a squash of 1.12 × 0.9 over 80 ms, and `sfx.click()`.
- [ ] Discovery: the `peekAt` peel at 0.6 s, a grip-tab mesh on the sheet's right edge, and one auto-scrub after 4 s with no touch.
- [ ] Content: one real project's four images go in `public/work/<id>/`, linked from `sheets[].image`. **Ask Aadit for them.**
- [ ] Check: screenshots at 0.6 s (hint visible), mid-scrub (four labelled planes), and the sheet's size (at least 3× his height on desktop, at least 55% of the screen width on phone). Run a critic round, then commit and push.

### Task 4: Events, count them in

**Files:**
- Modify `src/world/show/fairRule.ts` and `fairRule.test.ts`.
- Modify `src/world/show/Fair.tsx`.
- Create `src/ui/Polaroid.tsx` with its `.module.css`, rendered by `src/app/[section]/[project]/page.tsx` for events.
- Modify `src/content/projects.ts`: events gain `date?: string`, for example "March 2025".

**Interfaces (`fairRule.ts`):**
- **`walkers(attendance)`** returns `{ shown: number; more: number }`, where `shown = min(attendance, 40)` and `more = attendance - shown`.
  - This replaces the 1-per-4 `crowdSize` for the walk-in. Update its tests rather than keeping both rules.
- **`walkIn(i, shown, since, still?)`** returns `{ x: number; z: number; size: number; arrived: boolean }`.
  - Each figure starts at the EVENTS gate (the Grounds' origin plus about `(0, -2.5)`) and ends at `crowdSpot(i)`.
  - Everyone has arrived by 1.6 s.
- **`tilesLit(attendance, since)`**: how many ground tiles are lit. It rises in step with the arrivals and ends at `shown`, plus one more tile when `more > 0`.
- **`tickPitch(n)`**: the semitone step for the n-th arrival tick, rising in steps of 2 every 5 arrivals.

**Steps:**
- [ ] Write the tests:
  - attendance 0, 1, 40, 41 and 5,000 give the right `shown` and `more`;
  - everyone has arrived by 1.6 s, and with `still` all are there at once;
  - `tilesLit` never goes past its total;
  - `tickPitch` rises in steps.

  Then run them (expect a FAIL), implement, and run again (expect a PASS).
- [ ] Build the component in `Fair.tsx`:
  - **Walk-in.** Figures walk in from the gate instead of popping in.
  - **Tiles.** One lit ground tile per arrival, plus a "+N" tile drawn with `pixelText` when `more > 0`. The glyphs cover digits only if they are added to `src/world/voxel/lettering.ts`, so add 0–9 and +.
  - **Sound.** `sfx.click()` per arrival, at the stepped pitch. This needs a pitch parameter on `sfx.click`, or a new `sfx.tick(semitones)` in `src/audio/engine.ts`.
  - **Counter.** Remove the HTML "Came along" pin.
- [ ] Polaroid: when everyone has arrived, fire `fire("flash", projectId)` (`src/world/overlayState.ts`). `Polaroid.tsx` listens, shows a white flash, then drops a card into the project card with the event title, role, `date` (or `year`) and turnout. It is styled as a photo with a caption strip, its own CSS, and no animation with reduced motion.
- [ ] Content: one real event. **Ask Aadit** for its name, role, date, true turnout, and 2–3 colours.
- [ ] Check: the final frame (crowd matches turnout, tiles lit, polaroid in the card), plus the 0 and 5,000 cases. Run a critic round, then commit and push.

### Task 5: Code, the lab unfolds

**Files:**
- Create `src/world/show/unfoldRule.ts` and `unfoldRule.test.ts`.
- Modify `src/world/show/Lab.tsx`: the walls become separate hinged pieces. The lab body is in the static batch in `src/world/voxel/models.ts` `lab()`, so move its four walls out the way `labHood()` was moved.
- Modify `src/world/show/Machine.tsx`, or replace it for the open project.
- Modify `src/world/CameraRig.tsx`: an overhead view for an open code project, through `SHOW_AT` in `Stage.tsx`, or a view override like `VALLEY_VIEW`.
- Modify `src/content/projects.ts`: code projects gain `input?: string`.

**Interfaces (`unfoldRule.ts`):**
- **`wallAngle(w, since, still?)`**: hinge angle for wall `w` of 4, starting `w * 0.08` s apart. It reaches π/2 (flat) by `0.08*3 + 0.5` s.
- **`roomLayout(n)`** returns `{ x: number; z: number; w: number; d: number }[]`: n rooms in a row filling the lab's floor of about 9 × 6, in data order, each at least 1.6 wide.
- **`tokenAt(n, since)`** returns `{ room: number; x: number; z: number; shape: number; chomp: boolean }`.
  - The token crosses the rooms in about 1.2 s and its shape index steps per room.
  - `chomp` is true for 60 ms on entering each room.
- **`fitLabel(label, width)`**: the text cut to what fits a room at the voxel font's width (`textWidth` in `lettering.ts`), ending in "…" when cut.

**Steps:**
- [ ] Write the tests:
  - every wall is flat by about 0.74 s;
  - rooms neither overlap nor leave the floor, for n = 3, 4 and 5;
  - the token visits the rooms in order and is in the last one at the end;
  - `fitLabel` returns the full text when it fits.

  Then run them (expect a FAIL), implement, and run again (expect a PASS).
- [ ] Build the component: hinged walls fold flat; room outlines and labels sit on the floor (`pixelText`, letters added as needed); the token mesh changes shape per room, with a chomp scale and a 60 ms freeze; the last room's door opens on the result as a lit sign in the world. The camera holds overhead, with no ride.
- [ ] Content: one real build. **Ask Aadit** which of his six projects (in the other portfolio's `lib/projects.js`), its 3–5 parts, its input and its output.
- [ ] Check: one overhead screenshot (rooms in order, token in its final shape, sign lit). Run a critic round, then commit and push.

### Task 6: Impact kit

**Files:**
- Create `src/world/show/impact.ts`: a small shared store and helpers.
- Modify the show components from tasks 3–5 to call it on their landing moments.
- Modify `src/world/CameraRig.tsx` for the shake.
- Modify `src/audio/engine.ts` for one sound per place.

**Interfaces (`impact.ts`):**
- **`impact.hit(kind)`**: records the time.
- **`freezeAt(now)`**: true for 60 ms after a hit.
- **`shakeAt(now)`** returns `{ x: number; y: number }`: 0.08-unit amplitude, decaying to 0 within 200 ms.
- **`flareAt(now)`**: 0 to 1, lasting 2 frames, about 33 ms.

All three are 0 or false with reduced motion.

**Steps:**
- [ ] Write the tests: the freeze lasts exactly 60 ms; the shake decays to 0 by 200 ms; with reduced motion everything is 0. Run them (expect a FAIL), implement, and run again (expect a PASS).
- [ ] Wire it in:
  - the Stage's arrival thud (`sfx.thunk` in `Stage.tsx`) also calls `impact.hit`;
  - shows pause their own clocks during a freeze;
  - CameraRig adds the shake and removes it the next frame, the way the old settle nudge did;
  - the flare is a brief brightening of the key light.
- [ ] Sounds: one signature sound per place:

  | Place | Sound |
  |---|---|
  | Design | paper |
  | Code | chomp |
  | Events | crowd |
  | About | whistle |

  All four are built procedurally like the existing `sfx` ones. **Ask Aadit to approve them.**
- [ ] Check:
  - a frame at 1.3 s shows the flare in every place;
  - mute silences everything (`src/ui/SoundToggle.tsx`);
  - reduced motion cuts instantly.

  Run a critic round, then commit and push.

## After round 5

- Replace placeholders with real content everywhere:
  - projects: `src/content/projects.ts`;
  - certificates and clubs: `src/content/about.ts`;
  - the CV: `CV` in `about.ts`.
- EmailJS keys: `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` and `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`, in `.env.local` and in Vercel's environment variables. The template params are `from_name`, `reply_to` and `message`. Until the keys are set, the contact form stays hidden.
