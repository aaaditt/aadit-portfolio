# Trophy tent, and a wider home view

## Why

- **Certificates.** Aadit has 10–20 certificates, possibly more, in several kinds:
  - Coursera courses related to his degree
  - sports
  - hackathons and events
  - perhaps more kinds later

  The lantern line at the camp holds 3–4 at most, with labels that overlap, so it is replaced.
- **Home.** He wants the home view a little wider, so the camp (the About place) gets more presence from the first screen.

## Approaches considered (certificates)

- **A. Trophy tent (chosen by Aadit).** Shelves inside the camp's tent, one shelf per kind, one object per certificate.
- **B. Noticeboard.** A pinned paper per certificate on a board at the signpost. Readable but flat.
- **C. Spread across the valley.** Each certificate at the place its kind belongs to. The About answer gets split up.

## Design: the trophy tent

**Data (`src/content/about.ts`).** `CREDENTIALS` entries gain:
- `kind`: a free string, for example `"course"`, `"sport"` or `"event"`;
- an optional `link`, such as a Coursera verify URL.

`KINDS` gives each known kind a shelf name and an object shape. An unknown kind still gets a shelf: its name is the kind with a capital letter, and its object is a plain framed certificate. Shelves appear in the order their kind first appears in the list.

**The room.** The tent is smaller than him, so it is bigger on the inside: a lantern-lit room built out of sight under the valley.
- **Back wall.** Up to 5 shelves, one per kind. More than 10 items on a shelf wraps to a second row.
- **Objects by kind.**

  | Kind | Object |
  |---|---|
  | course | rolled scroll |
  | sport | medal |
  | event | badge on a lanyard |
  | anything else | framed certificate |

  Each object is tinted by kind, with a small plaque under each shelf.
- **Lighting.** One warm light.

**Getting in.**
1. The question chip "What have you earned?" replaces "What have you studied?".
2. He walks to the tent, the flap opens, and the camera pushes towards the doorway.
3. The frame goes dark through the flap, then opens on the room.

Leaving reverses this. With reduced motion, it cuts straight to the room.

**Picking.** Picking an object, on the shelf or in the card's list:
- lifts it forward into the light;
- shows its name, issuer and date in the card, with the verify link if it has one.

**Card.** The same certificates as a list under one heading per kind, so nobody needs the world to read them.

**Removed.** The lantern line and its rules: `lanternSlot`, `lanternGlow`, `lineLitAfter`, the string, and the lantern tests.

## Design: home view

- **Camera.** The home camera steps back about 20% along its current line of sight, from position `[6.75, 13.25, 40]` to about `[8.1, 14, 46]`, with the same target.
- **Opening flight.** Its last waypoint moves with it, from `(4, 13.5, 42)` to about `(4.8, 14.3, 48.4)`, so the landing stays one curve that arrives with nothing moving after it.
- **Check.** A frame strip of the landing, as before.

## Not doing

- No separate building for certificates.
- No change to the other camp answers.

## Left to the builder

- Exact object models and colours.
- The room's size and decoration.
- How the darkened doorway fades.
