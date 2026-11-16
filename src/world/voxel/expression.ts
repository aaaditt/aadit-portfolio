import type { SectionId } from "../../content/sections";
import { hash } from "./box";

/** What his face is doing. */
export type Face = {
  /** Open; shut mid-blink; or the closed, smiling eyes from his profile picture. */
  eyes: "open" | "shut" | "happy";
  /** Where his pupils point, from -1 (his right, the viewer's left) to 1. */
  look: number;
  mouth: "smile" | "grin" | "flat" | "o";
  /** How far his eyebrows are raised, in model pixels. Negative frowns. */
  brows: number;
  blush: boolean;
};

/** What he is up to, which decides his expression. */
export type Mood = {
  place: SectionId;
  running: boolean;
  waving: boolean;
  /** Seconds since he last arrived somewhere. */
  sinceLanding: number;
  /** Seconds since the page opened. */
  t: number;
  /** The visitor's pointer, from -1 (left of the screen) to 1. */
  pointerX: number;
  animate: boolean;
};

/** Blinks fall at a random moment in each window of this many seconds, so they never look timed. */
const WINDOW = 3.2;
const BLINK = 0.13;

/** True while his eyes are shut in a blink. Sometimes he blinks twice in quick succession. */
export function blinking(t: number): boolean {
  const n = Math.floor(t / WINDOW);
  const at = n * WINDOW + 0.3 + hash(n, 5, 61) * (WINDOW - 0.9);
  if (t >= at && t < at + BLINK) return true;
  const twice = hash(n, 6, 62) < 0.25;
  return twice && t >= at + 0.28 && t < at + 0.28 + BLINK;
}

/** Where in a repeating cycle of `length` seconds the moment `t` falls. */
const phase = (t: number, length: number) => ((t % length) + length) % length;

/** His expression for the moment. */
export function faceFor(m: Mood): Face {
  const face: Face = { eyes: "open", look: 0, mouth: "smile", brows: 0, blush: false };
  if (!m.animate) return face;

  if (m.running) {
    // Puffing along, eyes fixed on where he is going.
    face.mouth = "o";
    face.brows = -0.15;
  } else if (m.sinceLanding < 0.7) {
    // Ta-da.
    face.eyes = "happy";
    face.mouth = "grin";
    face.brows = 0.35;
  } else if (m.waving) {
    face.eyes = "happy";
    face.mouth = "grin";
    face.blush = true;
    face.brows = 0.25;
  } else if (m.place === "design") {
    // Concentrating on the stroke, then stepping back pleased with it.
    const p = phase(m.t, 5);
    if (p < 3.6) {
      face.mouth = "flat";
      face.brows = -0.2;
      face.look = -0.5;
    } else {
      face.eyes = "happy";
      face.blush = true;
    }
  } else if (m.place === "code") {
    // Steady typing, with an "aha" every so often, then a smile when it works.
    const p = phase(m.t, 7);
    if (p < 5) {
      face.mouth = "flat";
      face.look = Math.sin(m.t * 1.7) * 0.4;
    } else if (p < 5.8) {
      face.mouth = "o";
      face.brows = 0.4;
    }
  } else if (m.place === "play") {
    // Having fun, with a cheer now and then.
    face.mouth = "grin";
    face.brows = 0.2;
    if (phase(m.t, 6) > 4.8) {
      face.eyes = "happy";
      face.blush = true;
    }
  } else {
    // At the lookout: friendly, watching the visitor's pointer.
    face.look = Math.max(-1, Math.min(1, m.pointerX * 1.2));
  }

  if (face.eyes === "open" && blinking(m.t)) face.eyes = "shut";
  return face;
}
