# Stage 0: Set Up + Find the Look — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running Next.js project showing the same tiny 3D scene in three different moods side by side, so Aadit can pick or mix a look.

**Architecture:** A mood is a plain data object (palette, lighting, shape language, effects). One `StudyScene` component renders the same scene contents from whichever mood it is given. A studies page shows three canvases in a grid; each can be opened full-screen. Nothing here is the final world; the chosen mood's values carry into Stage 1.

**Tech Stack:** Next.js (App Router) + TypeScript, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-portfolio-world-design.md`

## Global Constraints

- Next.js App Router + TypeScript; hosted on Vercel later.
- The 3D canvas loads only in the browser (no server rendering of the canvas).
- Art is stylised low-poly built from simple shapes in code. No copied look from an existing famous 3D portfolio or game.
- Must not stutter on an ordinary laptop: three canvases at once must stay usable (cap pixel ratio at 1.5; pause canvases that are off-screen).
- Each mood must be clearly different from the other two at a glance.

## Review Focus

- Three WebGL canvases on one page on a weak GPU: page must stay responsive (pixel ratio cap, `frameloop` paused off-screen).
- Narrow phone screen: grid stacks to one column, no horizontal scroll.
- WebGL unavailable: a readable message instead of a blank page.
- `prefers-reduced-motion`: idle animation (bobbing, auto-rotate) is off.
- Unknown mood id in the URL (`/studies/nope`): Next.js 404, not a crash.

---

### Task 1: Project scaffold

**Files:**
- Create: Next.js app at repo root (`src/app`, TypeScript, ESLint, no Tailwind, `src/` dir, import alias `@/*`)
- Create: `vitest.config.ts`, `.gitignore`

- [ ] **Step 1:** `git init`, commit the existing `docs/`.
- [ ] **Step 2:** Scaffold with `npx create-next-app@latest . --ts --eslint --app --src-dir --no-tailwind --import-alias "@/*" --use-npm --yes`.
- [ ] **Step 3:** Install `three @react-three/fiber @react-three/drei @react-three/postprocessing` and dev deps `@types/three vitest`.
- [ ] **Step 4:** Add `"test": "vitest run"` and `"typecheck": "tsc --noEmit"` scripts.
- [ ] **Step 5:** Run `npm run build`. Expected: build succeeds.
- [ ] **Step 6:** Commit.

### Task 2: Mood definitions

**Files:**
- Create: `src/world/moods.ts`
- Test: `src/world/moods.test.ts`

**Interfaces:**
- Produces:

```ts
export type MoodId = "daylight" | "arcade" | "blueprint";
export type Mood = {
  id: MoodId;
  name: string;          // shown on the page
  tagline: string;       // one line describing the feel
  palette: { sky: string; ground: string; primary: string; secondary: string; accent: string; character: string; text: string };
  light: { ambient: number; sun: number; sunColor: string; sunPosition: [number, number, number]; shadows: boolean };
  fog: { color: string; near: number; far: number } | null;
  shape: "rounded" | "sharp" | "wire";   // shape language for buildings/props
  material: "soft" | "glow" | "line";    // surface treatment
  bloom: number;                          // 0 = off
};
export const MOODS: Mood[];              // exactly three, in display order
export function getMood(id: string): Mood | undefined;
```

- Mood directions:
  - `daylight` — "Paper Daylight": warm pastel, soft shadows, rounded shapes, friendly.
  - `arcade` — "Night Arcade": near-black with neon glow and bloom, sharp shapes, playful.
  - `blueprint` — "Blueprint": deep ink blue with pale line-drawn shapes on a grid, technical and calm.

- [ ] **Step 1: Write failing tests**

```ts
test("there are exactly three moods with unique ids", () => {
  expect(MOODS).toHaveLength(3);
  expect(new Set(MOODS.map(m => m.id)).size).toBe(3);
});
test("every palette colour is a 6-digit hex", () => {
  for (const m of MOODS) for (const c of Object.values(m.palette)) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
});
test("moods differ in shape and material", () => {
  expect(new Set(MOODS.map(m => m.shape)).size).toBe(3);
  expect(new Set(MOODS.map(m => m.material)).size).toBe(3);
});
test("getMood returns undefined for unknown ids", () => {
  expect(getMood("nope")).toBeUndefined();
  expect(getMood("arcade")?.id).toBe("arcade");
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `src/world/moods.ts`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 3: The study scene

**Files:**
- Create: `src/world/study/StudyScene.tsx` (scene contents for a mood)
- Create: `src/world/study/StudyCanvas.tsx` (client-only canvas wrapper)
- Create: `src/world/study/parts.tsx` (Island, Building, Tree, Character, NameSign)

**Interfaces:**
- Consumes: `Mood` from Task 2.
- Produces: `StudyCanvas({ mood: Mood, interactive?: boolean })` — a client component filling its parent. `interactive` enables orbit drag; default is slow auto-rotate.

Scene contents, identical across moods: a small floating island, one small building, two trees, a simple character standing in front (body + head), and the name "AADIT" as 3D text. Only the mood changes how they look.

- [ ] **Step 1:** Implement `parts.tsx`: each part takes `mood` and picks geometry by `mood.shape` and material by `mood.material` (`soft` = matte standard material, `glow` = dark body with emissive edges/accents, `line` = transparent fill with drawn edges).
- [ ] **Step 2:** Implement `StudyScene.tsx`: background, fog, lights from `mood.light`, the parts, bloom when `mood.bloom > 0`, grid floor when `mood.shape === "wire"`.
- [ ] **Step 3:** Implement `StudyCanvas.tsx`: `"use client"`, `dpr={[1, 1.5]}`, `frameloop` set to `"never"` while off-screen (IntersectionObserver), idle motion off under `prefers-reduced-motion`, readable fallback when WebGL is unavailable.
- [ ] **Step 4:** Run `npm run typecheck`. Expected: no errors.
- [ ] **Step 5:** Commit.

### Task 4: Studies pages

**Files:**
- Modify: `src/app/page.tsx` (render the studies grid for now), `src/app/layout.tsx`, `src/app/globals.css`
- Create: `src/app/studies/[mood]/page.tsx` (full-screen single mood)
- Create: `src/ui/StudiesGrid.tsx`

**Interfaces:**
- Consumes: `MOODS`, `getMood`, `StudyCanvas`.

- [ ] **Step 1:** `StudiesGrid`: three cards (canvas, mood name, tagline, "open full screen" link to `/studies/<id>`); three columns on wide screens, one column under 900px. Page heading: "Pick a look".
- [ ] **Step 2:** `/studies/[mood]`: full-viewport interactive canvas, mood name, back link; `notFound()` when `getMood` returns undefined; `generateStaticParams` from `MOODS`.
- [ ] **Step 3:** Remove the create-next-app starter content and styles.
- [ ] **Step 4:** Run `npm run build && npm test`. Expected: both pass.
- [ ] **Step 5:** Commit.

### Task 5: See it and check it

- [ ] **Step 1:** `npm run dev`; open `/` in a browser. Expected: three visibly different scenes, no console errors.
- [ ] **Step 2:** Open `/studies/arcade` and `/studies/nope`. Expected: full-screen scene; 404.
- [ ] **Step 3:** Resize to 390px wide. Expected: one column, no horizontal scroll.
- [ ] **Step 4:** Take a screenshot of each mood for Aadit to review.
- [ ] **Step 5:** Fix anything found, commit.

Deploy to Vercel is done after Aadit signs in (`vercel login` is interactive).
