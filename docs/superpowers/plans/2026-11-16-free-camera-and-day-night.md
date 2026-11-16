# Free Camera and Day/Night Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The camera stops chasing the character and can be turned by the visitor; a sun/moon button switches the world and the page between day and night.

**Architecture:** Camera turning is a pure module (`orbit.ts`) that turns a section's composed view by a yaw, pitch and zoom; `CameraRig` applies it after working out the section view as it did before the walking stage. The theme is a small store like `introStore.ts` that writes `data-theme` on `<html>`; CSS variables restyle the page, and the scene eases a single `night` number from 0 to 1 that lights, fog, glow and night-only objects read every frame.

**Tech Stack:** Next.js 16 app router, React 19, three 0.187, @react-three/fiber 9, vitest 5. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-free-camera-and-day-night-design.md`

## Global Constraints

- The character's movement (`src/world/walker.ts`, `src/world/voxel/routes.ts`, the run and poses in `Character.tsx`) does not change.
- Section camera views in `src/content/sections.ts` stay the composed starting point for each section.
- No more than 4 new real lights in the scene; other glow comes from full-brightness blocks.
- Reduced motion: theme switches instantly; section changes jump; turning the view still works.
- Vitest has no `@/` alias: tests and anything they import at runtime use relative imports.
- Windows: file names must not differ only by letter case.
- Every task ends with `npx eslint src`, `npx tsc --noEmit`, `npx vitest run` clean, then commit and `git push origin main` (which also deploys).

## Review Focus

- Dragging the view and letting go over a landmark must not open that landmark.
- Turning or zooming to the limits must never put the camera under the ground or leave the valley out of frame.
- A visitor with storage blocked gets the device's theme and a working button, with no error.
- First paint at night must not flash the day colours (and the reverse).
- Text contrast in both themes: body text at least 4.5:1 against its panel.

---

### Task 1: Camera goes back to the arc; the view can be turned

**Files:**
- Create: `src/world/orbit.ts`, `src/world/orbit.test.ts`, `src/world/OrbitInput.tsx`, `src/ui/ResetView.tsx`, `src/ui/ResetView.module.css`
- Modify: `src/world/CameraRig.tsx`, `src/world/WorldInner.tsx`, `src/world/Hotspots.tsx`, `src/world/voxel/Exhibits.tsx`, `src/app/layout.tsx`

**Interfaces:**
- Produces, in `orbit.ts`:
  - `export const orbit = { yaw: 0, pitch: 0, zoom: 1, dragging: false, moved: 0, turned: false }` (plain object; `moved` is pixels dragged since pointer down)
  - `export const LIMITS = { pitchUp: 0.5, pitchDown: -0.35, zoomIn: 0.55, zoomOut: 1.6, minHeight: 2.5 }`
  - `export function turnBy(dYaw: number, dPitch: number): void` — adds, clamps pitch, sets `turned`
  - `export function zoomBy(factor: number): void` — multiplies, clamps
  - `export function resetOrbit(): void`
  - `export function orbited(position: Vec3, target: Vec3, groundAt: (x: number, z: number) => number): Vec3` — rotates `position` about `target` by yaw (about vertical) and pitch (added to its elevation), scales distance by zoom, then raises y to at least `groundAt(x, z) + LIMITS.minHeight`. `Vec3 = [number, number, number]`.
  - `export function wasDrag(): boolean` — true when `moved > 6`

- [ ] **Step 1: Write failing tests** in `orbit.test.ts`: with yaw, pitch 0 and zoom 1 `orbited` returns `position` unchanged; yaw of `Math.PI` about target `[0,0,0]` maps `[0,5,10]` to `[0,5,-10]` (to 5 places); distance to target is preserved by yaw and pitch and scaled exactly by zoom; `turnBy(0, 9)` leaves `pitch === LIMITS.pitchUp`; `zoomBy(100)` leaves `zoom === LIMITS.zoomOut`; a result that would be below `groundAt + minHeight` is raised to it; `resetOrbit()` restores zeros and `turned === false`; `wasDrag()` is false at `moved = 3`, true at `moved = 10`.
- [ ] **Step 2: Run** `npx vitest run src/world/orbit.test.ts` — expected: fails, module missing.
- [ ] **Step 3: Implement `orbit.ts`.**
- [ ] **Step 4: Run** the test — expected: pass.
- [ ] **Step 5: `CameraRig.tsx`:** delete the chase (`CHASE`, `lean`, `chasePosition`, `chaseTarget`, the `m.run` branch, `run` on `Move`). On a section change keep calling `walker.go(section.id)` (or `walker.place` when not animating) but always start the timed arc. Restore the rest ease rate to 2.4. Call `resetOrbit()` on every section change and when the intro starts. After `goalPosition` is computed (and outside the intro), replace it with `orbited(goalPosition, goalTarget, groundY)`. Skip the pointer drift while `orbit.turned`.
- [ ] **Step 6: `OrbitInput.tsx`** (a component inside the Canvas, returns null): on the canvas element, pointer down/move/up drive `turnBy(-dx * 0.006, dy * 0.004)` and `orbit.moved`; two pointers pinch to `zoomBy`; `wheel` zooms (`zoomBy(Math.exp(deltaY * 0.001))`, `preventDefault`); window keys ArrowLeft/ArrowRight turn by 0.12, ArrowUp/ArrowDown pitch by 0.06, `+`/`-` zoom, ignored while the intro is not `"done"` or focus is in a link or button. Set `touch-action: none` on the canvas. Mount it in `WorldInner.tsx`.
- [ ] **Step 7: Clicks:** in `Hotspots.tsx` and `Exhibits.tsx` `onClick`, return early when `wasDrag()`.
- [ ] **Step 8: `ResetView`:** a small button (text "Reset view"), fixed above the bottom bar on the right, shown only while `orbit.turned` (poll in `requestAnimationFrame` like `SpeechBubble`), calls `resetOrbit()`. Add to `layout.tsx`.
- [ ] **Step 9: Verify in a browser** at 1440x900: a section change no longer follows him and he runs into view; a synthetic drag turns the view; reset returns. Capture a contact sheet.
- [ ] **Step 10: Commit** `feat: the camera stops chasing him and the view can be turned`, push.

### Task 2: Theme store, button and page colours

**Files:**
- Create: `src/ui/themeStore.ts`, `src/ui/themeStore.test.ts`, `src/ui/ThemeToggle.tsx`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`, `src/ui/BottomBar.tsx`, `src/ui/BottomBar.module.css`, `src/app/page.module.css`, `src/app/[section]/page.module.css`, `src/ui/ReplayIntro.module.css`, `src/world/World.module.css`

**Interfaces:**
- Produces, in `themeStore.ts`:
  - `export type Theme = "day" | "night"`
  - `export function initialTheme(stored: string | null, prefersDark: boolean): Theme` — a stored `"day"` or `"night"` wins; anything else falls back to the device.
  - `export const theme = { get(): Theme, set(next: Theme): void, toggle(): void }` — `set` writes `document.documentElement.dataset.theme`, saves to `localStorage` under `"theme"` inside try/catch, notifies listeners.
  - `export function useTheme(): Theme` (`useSyncExternalStore`, server snapshot `"day"`).
  - `export const THEME_SCRIPT: string` — inline script that sets `data-theme` before first paint using the same rule.

- [ ] **Step 1: Failing tests:** `initialTheme("night", false) === "night"`, `initialTheme("day", true) === "day"`, `initialTheme(null, true) === "night"`, `initialTheme(null, false) === "day"`, `initialTheme("purple", false) === "day"`.
- [ ] **Step 2: Run** — expected fail. **Step 3: Implement.** **Step 4: Run** — expected pass.
- [ ] **Step 5: `layout.tsx`:** add `<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />` first in `<body>` and `suppressHydrationWarning` on `<html>`.
- [ ] **Step 6: `globals.css`:** add panel variables to `:root` (day): `--panel: rgb(255 253 247 / 0.86)`, `--panel-ink: #17202b`, `--panel-soft: #4a5666`, `--panel-line: rgb(23 32 43 / 0.16)`, `--panel-hover: rgb(23 32 43 / 0.08)`, `--panel-active: rgb(23 32 43 / 0.14)`. Under `:root[data-theme="night"]`: `--sky-top: #0b1030`, `--sky-mid: #1b2452`, `--haze: #1a2140`, `--panel: rgb(12 18 28 / 0.72)`, `--panel-ink: #ffffff`, `--panel-soft: rgb(255 255 255 / 0.72)`, `--panel-line: rgb(255 255 255 / 0.16)`, `--panel-hover: rgb(255 255 255 / 0.08)`, `--panel-active: rgb(255 255 255 / 0.16)`, `--paper: #1b2333`, `--ink: #f3f1ea`, `color-scheme: dark`. Replace the hard-coded panel, text and border colours in the bar, section card, home plate, replay button and reset button with these. The home title stays white with its dark shadow in both themes. The intro cover and cinema bars stay dark in both.
- [ ] **Step 7: Sky:** in `World.module.css` add a `::before` night-sky layer (the night gradient plus a tiled star field made from a few `radial-gradient` dots) whose opacity goes 0 to 1 with `data-theme="night"`, transition 1.5s, none under reduced motion.
- [ ] **Step 8: `ThemeToggle.tsx`:** a button in the bar after the section links, separated by a thin divider; pixel sun icon by day, moon by night; `aria-label` "Switch to night" / "Switch to day"; `aria-pressed` for night. Same size and hover as the bar items.
- [ ] **Step 9: Verify** both themes in a browser at 1440x900 and 390x844; compute contrast for `--panel-ink` and `--panel-soft` on `--panel` over a mid sky colour in both themes (at least 4.5:1).
- [ ] **Step 10: Commit** `feat: day and night theme for the page, with a sun/moon button`, push.

### Task 3: Night in the world

**Files:**
- Create: `src/world/daylight.ts`, `src/world/voxel/Night.tsx`
- Modify: `src/world/Scene.tsx`, `src/world/WorldInner.tsx`, `src/world/voxel/models.ts`, `src/world/voxel/world.ts`, `src/world/voxel/Voxels.tsx`, `src/world/voxel/Animated.tsx`, `src/world/voxel/world.test.ts`

**Interfaces:**
- Consumes: `theme`, `useTheme` from Task 2.
- Produces, in `daylight.ts`: `export const daylight = { night: 0 }` — 0 by day, 1 by night, eased by a `<Daylight />` component in the Canvas (rate about 2 per second; snaps under reduced motion).
- `World` gains `nightGlow: Box[]`: windows, torch flames, lantern panes.
- `Voxels` gains an optional `fade?: { value: number }` prop for glow batches: the material's opacity follows it each frame.

- [ ] **Step 1: Failing test** in `world.test.ts`: `getWorld().nightGlow.length` is greater than 20 and every box has positive size.
- [ ] **Step 2: Models:** `torch(): { solid: Box[]; glow: Box[] }` (a post about 1.6 tall with a flame); `lantern()` (small hanging box). In `world.ts` place two torches beside each of the studio, lab and arcade doors and two at the lookout camp, four lanterns on the bridge rails; collect their flames, plus a glowing pane over every existing window (studio window, lab windows, cottage windows, windmill window), into `nightGlow`. Run the route tests: torches must not block a route.
- [ ] **Step 3: `Scene.tsx`:** lights, fog and water colour lerp by `daylight.night` each frame. Day values stay as now. Night: hemisphere `#3a4a8c` over `#1a2238` at 0.75; sun becomes the moon, colour `#9db4ff`, intensity 0.9, same direction; fog colour `#1a2140` (matches `--haze` at night). Campfire light intensity rises from 6 to 10. Draw `nightGlow` with `fade={daylight}`. Add up to 3 warm point lights (plaza, arcade front, bridge), intensity 0 by day.
- [ ] **Step 4: `Night.tsx`:** a moon (a few pale blocks high in the north-east sky, visible only when `night > 0.05`) and about 30 fireflies: small full-brightness squares drifting near the trees and river, opacity following `night`, still under reduced motion.
- [ ] **Step 5: Verify in a browser:** day unchanged from before; night readable (landmarks, paths and the character all distinguishable), glow visible, switch fades smoothly. Contact sheet of all five sections at night and one mid-fade.
- [ ] **Step 6: Commit** `feat: night in the valley, with lit windows, torches, lanterns and fireflies`, push.

### Task 4: No blank walls

**Files:**
- Modify: `src/world/voxel/models.ts`

- [ ] **Step 1:** Turn each section view half-way and all the way round in a browser and capture what is seen.
- [ ] **Step 2:** Add back and side windows, a back door or trim to `studio`, `lab`, `cottage`; a back panel and vents to the giant cabinet in `arcade`; a back to the stage. Their panes join `nightGlow` through the same route as Task 3.
- [ ] **Step 3:** Re-capture; `world.test.ts` block-count limit (under 40000) still passes.
- [ ] **Step 4: Commit** `feat: backs and sides for the buildings, now that they can be seen`, push.

### Task 5: Critic pass and wrap-up

- [ ] **Step 1:** Run the critic agent on fresh day, night and turned-view captures; implement its ranked advice; commit and push.
- [ ] **Step 2:** `npx next build`; open the live site and confirm both themes load.
- [ ] **Step 3:** Update `docs/superpowers/plans/2026-11-16-round-3-game-feel-polish-sound.md` to mark day/night as done and note the camera change.
