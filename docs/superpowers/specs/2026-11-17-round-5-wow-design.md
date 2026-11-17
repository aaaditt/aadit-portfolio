# Round 5: from "neat" to "wow"

## Status (2026-11-17)

| Item | State |
|---|---|
| 1. Stage | Built and live (commit 8fd4104). |
| 2. About: light the valley | Built and live (commit 640dac4). |
| 3. Design: the Lightbox | Not started. Waits on one real design project's four stage images. |
| 4. Events: count them in | Not started. Waits on one real event. |
| 5. Code: the lab unfolds | Not started. Waits on one real build split into parts. |
| 6. Impact kit | Not started. Last. |

Also built on 2026-11-17, outside this list, at Aadit's request:
- **Intro landing.** The opening flight lands already composed, and its final stretch was re-routed.
- **Home view.** About 20% wider.
- **Trophy tent.** Replaces the lantern line. See `2026-11-17-trophy-tent-and-home-view-design.md`.

The plan for items 3 to 6 is `docs/superpowers/plans/2026-11-17-round-5-items-3-to-6.md`.

## How this was decided

Aadit judged round 4 "still not giving wow factor" and asked for a team of agents with roles to debate it:
- **Pitch.** Three designers pitched independently: a game designer, a creative web developer and an art director.
- **Judging.** A critic panel scored all 18 ideas. It was an Awwwards juror, a recruiter who skims 200 portfolios a week, and a graphics engineer.
- **Rebuttal.** The designers answered the panel's questions.
- **Ruling.** The panel ruled on what to build.

## Why round 4 was not wow (all five agreed)

1. **The show is a prop.** It filled about 12% of the frame in a busy, evenly lit village. The only frame that worked was the night camp shot, because darkness made the fire the one bright thing.
2. **Flat light, one camera.** Every place used the same shot, framed as if the card weren't there.
3. **Repeated text.** The world repeated the card, so three layers of text competed.
4. **No transformation.** Props appeared; the place never turned into the thing opened.
5. **Placeholders.** They cannot wow. This is a hard gate: placeholder content cannot pass any "done when" below.

## The rule

When an item opens, the world goes dark around one lit stage. Within 1.5 seconds that place physically turns into the item's own facts. The card stays readable, and nothing on the stage repeats it.

## Killed

| Idea | Why |
|---|---|
| Camera rides through the machine | Motion-sick, and tedious by the fifth project. |
| Hold-the-mic | Generic interaction with no meaning. |
| Confetti | Generic party effect. |
| Hiding the card | Hides the facts recruiters read. |
| Cursor ripple on the grass | A tech demo that means nothing. |
| 1:1 crowd of 250 | Too slow; capped at 40 figures plus "+N". |
| Crowd spelling initials | Breaks on real event names. |
| Meadow mosaic of a UI screen | Turns to noise. |
| Dolly-zoom vertigo | Fights the long lens. Deferred. |
| Time spent as scrub resistance | Nobody reads it as data. Shown as a label instead. |

## Items

### 1. Stage (built)

- **Light.** World light ×0.4 by day, 0.85 down to 0.55 by night.
- **Fog.** Near = d − 4, far = d + 40, tinted per place:

  | Place | Day / night fog | Key light |
  |---|---|---|
  | Design | `#7d9a94` / `#1d3a3c` | `#fff4dc` |
  | Code | `#6c7f96` / `#0f1a2e` | `#8fe3ff` |
  | Events | `#c49a64` / `#3a2414` | `#ffe2b0` |
  | About | `#c99a6a` / `#1b2440` | `#ffa24a` |

- **Dim everything else.** Things beyond a radius of the show darken, as the radius closes from 14 to 6.
- **Lens.** Long lens: FOV 22 on desktop, 26 on phone. The camera steps back 1.35×.
- **Hidden while staged.** Bubbles, pinned captions, far villagers, birds, smoke and clouds.
- **Card.** 96% opaque.
- **A "wide" stage** (the valley view) dims the world but keeps the lens and framing.
- **Code.** `src/world/stageRule.ts`, `stageStore.ts`, `show/Stage.tsx`.

### 2. About: light the valley (built)

- **The beams.** "What have you done?" raises one beam per place (design, code, events, clubs), 150ms apart. Each is as tall as its count and tagged with that count, read from the data; the clubs beam also carries his role.
- **Going there.** Clicking a beam or its tag goes to that place.
- **Code.** `show/Beams.tsx`, `valleyRule.ts`, `src/ui/ValleyTags.tsx`.

### 3. Design: the Lightbox

**Rise.**
- About 60 meadow voxels rise in a wave from the easel and assemble into an upright, backlit hero sheet, at least 3× his height.
- The camera sits low, behind his shoulder.

**Scrub.**
- Dragging sideways pulls the sheet apart into four labelled stage planes, with "N weeks" printed on a plane if known.
- Releasing snaps to the nearest stage with a squash and a paper tick.
- The card's chips stay in sync with the drag.

**Discovery.**
- At 0.6 s the top plane peels back 15° and springs back.
- A grip tab sits on the sheet's edge.
- With no touch after 4 s, it scrubs once on its own.

**Done when:**
- the sheet is at least 3× his height on desktop and at least 55% of the screen width on a phone;
- the hint is visible at 0.6 s;
- a shot mid-scrub shows four separated, labelled planes.

### 4. Events: count them in

- **Walk-in.** Plays on its own in 1.6 s or less: up to 40 figures stream in through the EVENTS gate. Above that, a lit "+N" tile shows the rest.
- **Count.** Ground tiles light in step with the arrivals, replacing the HTML counter. A tick rises in pitch in steps.
- **Polaroid.** When the crowd is full there is one flash, and a polaroid drops into the card showing the event, role, date and turnout.
- **Done when** the final frame shows the crowd matching the turnout, the tiles lit, and the polaroid in the card.

### 5. Code: the lab unfolds

- **Unfold.** The lab's walls hinge outward flat, 80ms apart, with a thud each.
- **Diagram.** The floor becomes the project's diagram: one room per part, in data order, with large voxel labels.
- **Token.** A token auto-plays from room to room, changing shape in each. Each room chomps it with a 60ms freeze, about 1.2 s in all.
- **Result.** The last room's door opens on the result as a lit sign.
- **Camera.** Fixed overhead.
- **Done when** one overhead shot shows the rooms in order, the token in its final shape, and the sign lit.

### 6. Impact kit

- **Effects.** A shared rim flare, a 60ms freeze, a light camera shake, and one sound per place.
- **Done when:**
  - a frame at 1.3 s shows the flare in every place;
  - mute silences all of it;
  - reduced motion cuts instantly.

## What Aadit must provide

| Before | What |
|---|---|
| Item 3 | One real design project with four stage images (sketch, layout, colours, final), plus weeks per stage if known. |
| Item 4 | One real event: name, his role, date, true turnout, and 2–3 colours. |
| Item 5 | One real build split into 3–5 named parts, with its input and its output. |
| Item 6 | Approve a sound per place. |
