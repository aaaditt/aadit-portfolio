# Trophy tent and wider home view: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the lantern line with a "bigger on the inside" trophy room in the camp's tent (one shelf per certificate kind, any number of kinds), and widen the home view by about 20%.

**Architecture:**
- A pure rule (`trophyRule.ts`) lays out shelves from the credential list and sizes the room.
- A `tentStore` holds whether the camera is inside and how dark the doorway fade is.
- `Trophies.tsx` draws the room under the valley and runs the enter/leave sequence.
- CameraRig, Stage and Character read `tentStore`.

**Tech stack:** react-three-fiber, vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-trophy-tent-and-home-view-design.md`

## Global constraints

- Shelves appear in first-appearance order of `kind`.
- Up to 10 items per shelf row; more wrap to a further row of the same shelf.
- Kinds: `course` is a scroll, `sport` a medal, `event` a badge on a lanyard, anything else a framed certificate.
- An unknown kind's shelf name is the kind with a capital letter.
- The room sits out of sight beneath the camp.
- With reduced motion, entering and leaving cut instantly, with no fade.
- The card lists every credential under one heading per kind, with a "Verify" link when there is one.

## Review focus

1. **A kind with 21+ items:** wraps to three rows of its shelf, and the room grows to fit.
2. **One credential only:** a single shelf with one object, centred.
3. **Leaving the About page while inside:** the camera and he come back out, and the fade clears.
4. **Picking another question while inside:** leaves the room first, then answers.
5. **A kind string with odd case or spaces** ("Hackathon win"): it gets one shelf, titled "Hackathon win".

---

### Task 1: Data and layout rule

**Files:**
- Modify: `src/content/about.ts`
- Create: `src/world/show/trophyRule.ts`
- Create: `src/world/show/trophyRule.test.ts`
- Modify: `src/content/about.test.ts`

**Steps:**

- [ ] **Data.** In `Credential`:
  - Add `kind: string` and `link?: string`.
  - Remove `state`; "in progress" goes into `when` instead (for example "2024 to 2028, in progress").
  - Change the ask `study` to `earned`: chip "What have you earned?", says "Come inside!".
- [ ] **Tests.** `shelves(list)` returns `{ kind, title, shape, items, rows }[]` in first-appearance order.
  - `title`: from `KINDS`, or the kind with a capital letter.
  - `shape`: `"scroll" | "medal" | "badge" | "frame"`.
  - `rows`: `Math.ceil(n / 10)`.
- [ ] **Tests.** `slots(list)` returns, for each credential id, `{ x, y }` on the back wall.
  - Rows go top-down, centred left to right, 0.85 apart across and 1.05 apart down.
  - No two slots overlap.
- [ ] **Tests.** `roomSize(list)` returns `{ w, h }`.
  - `w >= 10 * 0.85 + 2`.
  - `h` grows with the total row count, and is at least 5.
- [ ] Run the tests and see them fail. Implement. Run the tests and see them pass.

### Task 2: Room, enter and leave sequence, camera, stage, character

**Files:**
- Create: `src/world/tentStore.ts`
- Create: `src/world/show/Trophies.tsx`
- Modify: `src/world/show/Camp.tsx` (drop the lanterns; the `earned` question opens the flap and sends him to the tent)
- Modify: `src/world/show/campRule.ts` and `campRule.test.ts` (drop the lantern rules)
- Modify: `src/world/voxel/models.ts` (drop `hangingLantern` and the pole; add object models per shape)
- Modify: `src/world/CameraRig.tsx`, `src/world/show/Stage.tsx`, `src/world/voxel/Character.tsx`, `src/world/walker.ts` (add `enter(x, y, z, facing)`)
- Modify: `src/world/Scene.tsx`
- Create: `src/ui/DoorFade.tsx`, mounted in `src/app/layout.tsx`

**Tent store:** `tent = { inside: boolean, fade: number }`.

**Sequence, driven by `Trophies.tsx`:**
1. Asked `earned` and he has reached the tent: fade to 1 over 0.35 s.
2. At full black: set `inside`, put him in the room, and snap the camera.
3. Fade back to 0 over 0.45 s.
4. Leaving (any other question, or leaving About) reverses this.

**Checks:**
- [ ] `npm test`, typecheck, lint and build all pass.

### Task 3: Card, and the home view

**Files:**
- Modify: `src/ui/Asks.tsx` (the grouped list, `trophies` pick)
- Modify: `src/world/pickStore.ts` (rename `lanterns` to `trophies`)
- Modify: `src/content/sections.ts` (home position `[8.1, 14, 46]`)
- Modify: `src/world/CameraRig.tsx` (last flight point `(4.8, 14.3, 48.4)`)

**Checks:**
- [ ] Screenshots: home (desktop and phone), the room (desktop and phone), and a picked trophy.
- [ ] A landing frame strip.
- [ ] A critic round.
- [ ] Commit and push.
