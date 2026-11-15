# Portfolio world — design

Date: 2026-11-15

## Intent and why

Aadit wants a portfolio website and wants to make it slowly and with care, each part made well. It is for everyone: recruiters, clients, other makers, and Aadit themself. It should be impressive, innovative, and interactive, with good animation, "like a 3D game kinda". It shows a mix of work: design/visual, coding/software, and games/event-type things.

Aadit wants to start with one part, get into the groove, and then complete it. Claude builds; Aadit is creative director, reacting to what they see and steering the look and feel.

## Approaches

| Approach | Trade-off | Result |
|---|---|---|
| **Small 3D world** — move around, one zone per interest | Most game-like, grows zone by zone. Most work; needs care on phones; needs a fast path for busy visitors | **Picked by Aadit** |
| Scroll-through 3D journey | Cinematic, phone-friendly, but watched more than played | Not picked |
| Regular site + one 3D centerpiece | Quickest and most readable, least game-like | Not picked |

## Goals

- A world that feels good to move around in within the first five seconds.
- Three zones: Design Studio, Code Lab, Arcade (games + events). Walking up to something opens the project behind it.
- A **Quick View**: a plain, fast, well-designed page with the same content, one click away, for recruiters, phones that struggle, and search engines.
- Every stage ends in something finished and live, so the site is always showable.

## Non-goals (for now)

- Blog, CMS, login, backend, multiplayer. Content lives in one file in the repo.
- All three zones at once. One zone is finished before the next begins.

## Anti-goals (failure even if it works)

- A copy of an existing famous 3D portfolio or game. The world is Aadit's own design.
- A cool demo where a recruiter can't find the work or the contact link in 10 seconds.
- A long loading screen or a site that stutters on an ordinary laptop.
- Rushed, generic-looking parts. Polish beats quantity.

## How it gets made

These are Claude's calls, not things Aadit decided. Aadit can change any of them.

- **Next.js (App Router) + TypeScript**, hosted on Vercel. `/` is the 3D world; `/work` is Quick View, rendered as plain HTML so it loads fast and shows up in search and link previews.
- **React Three Fiber + drei** (three.js in React) for the world; **Rapier** for collisions/physics; **Zustand** for small shared state (which panel is open, sound on/off).
- **Motion** for interface animation (panels, menus, Quick View page).
- **One content file** (`src/content/projects.ts`): every project's title, zone, description, images, links. Both the world and Quick View read from it, so work is entered once.
- **Art:** stylised low-poly, built from simple shapes in code plus free CC0 models restyled to one palette. Aadit's own models can replace any of it later.
- **Controls:** WASD/arrow keys and click-to-move on desktop; tap-to-move on phones.
- **Safety nets:** the 3D canvas loads only in the browser, behind a short designed loading screen; reduced-motion and weak-device visitors are offered Quick View.

Planned layout:

```
src/app/page.tsx            world entry (loads the canvas client-side)
src/app/work/page.tsx       Quick View
src/content/projects.ts     all portfolio content
src/world/                  Scene, Player, Camera, Lighting, controls
src/world/zones/            Hub, Arcade, DesignStudio, CodeLab
src/ui/                     panels, HUD, loading screen
public/models, public/images
```

## Stages

Each stage ends with Aadit looking at it in the browser and directing changes before the next begins.

0. **Set up + find the look.** Create the project, git, first deploy. Build the same tiny scene in three different moods (palette, lighting, shapes, character) side by side. Aadit picks or mixes.
1. **The hub and the feel.** Ground, the character, movement, camera follow, lighting, Aadit's name in the world. Tuned until moving around is fun with nothing else there.
2. **First zone, start to finish.** One zone (suggested: Arcade) with real projects: approach an object, it reacts, a panel opens with the project. This sets the pattern every other zone reuses.
3. **Quick View + go live properly.** `/work` page from the same content, the Quick View button, loading screen, link preview image, domain.
4. **Second and third zones**, one at a time, each with its own character and one unique interaction.
5. **Polish pass.** Sound, small secrets, phone controls, accessibility, performance tuning, about/contact.

## Left to the builder

- The look of the world (palette, lighting, shapes, the character). Decided in Stage 0 by Aadit choosing between three mood studies.
- Which zone is built first (Arcade suggested).
- Each zone's unique interaction.

## Needed from Aadit along the way

- A list of projects per zone with a line or two each, plus images/links (before Stage 2).
- Any sites, games, or art styles they love or hate (useful for Stage 0).
- Contact links and, later, a domain name.

## Verification

- `npm run dev`, open in the browser, and screenshot each stage's result for review.
- `npm run build` and typecheck pass before every deploy.
- Frame rate in the world on a normal laptop: steady 60fps target, never below 30. Loading under ~3s on a decent connection.
- Lighthouse on `/work`: performance and accessibility 90+.
- Tested on a real phone from Stage 2 onward; keyboard-only path to all content via Quick View.

## Update after the Stage 0 look review (2026-11-15)

Aadit reviewed the three look studies and decided:

- **Look:** the Paper Daylight colour scheme is the starting point, but not the sketch as it was. The real scene should be much more detailed.
- **Layout:** a small floating bar at the bottom with the site's options, like the tab bar in Instagram and YouTube on iPad.
- **Main page:** a detailed 3D scene.

What changed as a result (Claude's calls, for Aadit to correct):

- The bottom bar is the way to get around. Walk-around character controls (WASD, click-to-move) and Rapier physics are dropped.
- The bar's options are Home, Design, Code, Play, About. Each is a real address (`/design`, `/code`, `/play`, `/about`) and glides the camera to that part of the same island.
- The island lives in the root layout so it keeps running between sections.
- Quick View (`/work`) is still planned; the section pages now carry the project content, shown in a panel over the scene.
- The look studies were removed from the code; they remain in git history.

## Update after the island review (2026-11-15)

Aadit reviewed the rounded Paper Daylight island and asked for a different direction:

- **Style:** pixelated and blocky, "somewhat in the middle" of a top-down pixel RPG and a block-building game. It must stay an original design.
- **World:** a whole terrain, not one island; bigger, busier, more detailed, with better colours.
- **Entrance:** a cinematic opening animation.
- **Character:** modelled on Aadit's GitHub profile picture (dark curly hair, navy hoodie, closed-eye smile), animated, saying hi.
- **Name:** shown properly, not as multicoloured blocks.
- **Bar and font:** a more transparent, premium bottom bar; a different font.
- **Process:** a critic agent reviews the design in the background and its advice is implemented in rounds.
- **GitHub:** every change is pushed to https://github.com/aaaditt/aadit-portfolio.

What was built in response (Claude's calls):

- The world is generated: a 96x96 height map with a river, a lake to the south, a ring of mountains, and flat plateaus for each place. All blocks are drawn in instanced batches.
- The scene is drawn at one third of screen resolution and scaled up with hard edges for the pixel look.
- Places: a lookout camp with the character (Home and About), a Design Studio with a giant pencil, a Code Lab with a `</>` sculpture, an Arcade with a giant cabinet, tent and stage, plus a village, farm, windmill, bridge, boat and hot-air balloon.
- A 9-second opening flight that starts as a top-down map view, with letterbox bars and a skip button. It plays once per browser tab and never under reduced motion.
- Fonts: Pixelify Sans for headings, Space Grotesk for body text.
- Paper Daylight's rounded shapes and palette were dropped in favour of natural terrain colours with coral, teal and navy accents.

Still open: how projects are presented inside each section (a recommendation has been put to Aadit).
