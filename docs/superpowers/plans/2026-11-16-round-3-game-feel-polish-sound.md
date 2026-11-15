# Portfolio world, round 3: make it play, look and sound like a game

## Context

The voxel valley is built and pushed to GitHub: generated terrain, an opening where the land rises from a lake, a character modelled on Aadit's profile picture, five sections reached by a bottom bar or by clicking landmarks, and placeholder exhibits. Aadit says it "looks good, but could be better" and chose what to work on next:

- **More game feel**, with the character **walking to each place** himself.
- **Visual polish.**
- **Sound and music.**
- Real projects come **later**; use **placeholders** for now.
- **Not going online yet.**
- "There might be other things I'm not realising or seeing" — so this plan also proposes things Aadit didn't ask for, marked as such.

Each stage ends with Aadit looking at it and steering before the next begins. Every change is committed and pushed to `github.com/aaaditt/aadit-portfolio`. A critic agent reviews after stages 1, 2 and 4 and its advice is implemented.

## Stage 1 — He walks there

Picking a section (bar or landmark) makes the character run along the paths to that place, with the camera following him, then settle into the section view.

- **Path graph:** turn the existing `PATHS` segments in `src/world/voxel/terrain.ts` into named nodes (lookout, bridge, plaza, design, code, play) and a shortest-route function. Pure and unit-tested.
- **Walker:** `Character` gains a position driven by a route instead of a fixed spot. Reuse `groundY()` from `src/world/voxel/Life.tsx` (move it to `terrain.ts`) so he steps up slopes and crosses the bridge deck. Add a run cycle (legs and arms swing), and turn to face travel direction.
- **Camera:** `src/world/CameraRig.tsx` follows him from behind and above during the run, then eases into the section's existing pose from `src/content/sections.ts`. Runs last about 2.5 s regardless of distance; reduced-motion visitors and direct links skip straight to the end.
- **Arrival idles:** paints at an easel (Design), types at a terminal (Code), plays a cabinet (Play), arms crossed and waving (Home/About).
- **Reactions:** exhibits bounce and light up on hover; villagers stop and turn to look as he passes.

## Stage 2 — Visual polish

- **Block outlines:** a one-pixel darker edge round shapes, from a depth and normal edge pass at the low render resolution. The critic's single biggest remaining lever. New post-processing step in `src/world/WorldInner.tsx`; `@react-three/postprocessing` is already installed.
- **Richer building fronts:** signboards over each door with pixel lettering, window frames and shutters, flower boxes, brick and plank variation. Edits to `src/world/voxel/models.ts`.
- **Day and night:** a toggle in the bar (sun/moon). Night swaps the sky gradient, sun colour and fog, lights the lamps and windows, adds stars and fireflies. Light and fog live in `src/world/Scene.tsx`; sky colours in `src/app/globals.css`.
- **Pixel wordmark and icons:** the AADIT title and the five bar icons redrawn on a pixel grid as SVG, replacing the font-rendered title in `src/app/page.tsx` and the line icons in `src/ui/BottomBar.tsx`.
- **Landing beat:** a small camera overshoot and settle at the end of the opening.

## Stage 3 — Sound and music

All sound is generated in the browser with the Web Audio API, so there are no audio files to license or load.

- **Music:** a soft looping chiptune-style track, with a calmer variant at night.
- **Effects:** footsteps while he runs, a click on the bar, a chime on arriving, a whoosh during the opening, blocks "thunking" as the land rises.
- **Ambience:** birds, river, campfire crackle, louder as the camera gets close.
- **Controls:** a sound button in the bar. Sound starts **off** and only plays after the visitor turns it on (browsers block autoplay, and unexpected sound puts people off). The choice is remembered.
- New `src/audio/` module; a small store like `src/world/introStore.ts`.

## Stage 4 — Placeholder project cards

- **Content file:** `src/content/projects.ts` with clearly labelled sample entries (three per section), typed so real ones drop in later.
- **In the world:** each exhibit from `src/world/voxel/world.ts` is tied to one entry and becomes its own clickable hotspot (extend `src/world/Hotspots.tsx`).
- **Item card:** clicking an exhibit walks him to it and opens a game-style card: pixel thumbnail, title, one-line description, "stats" (role, tools, year), and link buttons. The section panel lists the same entries as inventory slots, as a fast path.
- Routes: `/design/[project]` etc., so a single project can be linked.

## Things you may not have thought of (proposed, not requested)

Included in the stages above because they are cheap and add a lot:
- Day/night toggle (Stage 2), villagers reacting to him (Stage 1), arrival idles per section (Stage 1).

Worth doing after Stage 4, each small:
- **Secrets:** a few hidden things to find (a cat on a roof, a chest behind the windmill) with a tiny "found 2 of 5" counter. Gives visitors a reason to stay.
- **A loading bar** that tracks the real world build instead of a blinking square.
- **Link preview image:** what shows when the site is pasted into WhatsApp, LinkedIn or Slack.
- **A plain "Quick View" page** listing everything without the 3D, for recruiters in a hurry and for search engines. Planned since the first design and still missing.
- **Low-power mode:** detect slow devices and simplify shadows and effects so it never stutters.

## Not in this round

- Real project content (waiting on Aadit by choice).
- Deployment (Aadit chose "not yet").
- Free-roam keyboard control (Aadit chose guided walking).

## Verification

- `npx eslint src`, `npx tsc --noEmit`, `npx vitest run` and `npx next build` after each stage.
- New unit tests: route finding (every section reachable, shortest route chosen), project content shape.
- In a browser at 1440x900 and 390x844: capture frames inside the page at exact moments using the Replay intro button and bar clicks, as done in the last round.
- Frame rate stays at 60 on this laptop with outlines and night mode on.
- Reduced-motion: no run, no opening, no music by default.
- Critic agent review with fresh captures after stages 1, 2 and 4.
- Keep the dev server and browser checks light on memory: close the test browser between checks.
