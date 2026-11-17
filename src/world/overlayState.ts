/**
 * Small pieces of state that the 3D scene writes every frame and the page reads every frame.
 * They are plain objects, not React state, so following the scene costs no re-renders.
 */

/** How far through the opening flight we are, from 0 to 1. */
export const flight = { progress: 0 };

/** Where each district's name belongs on screen during the opening map view, in CSS pixels. */
export const mapLabels: { text: string; x: number; y: number }[] = [
  { text: "Design", x: 0, y: 0 },
  { text: "Code", x: 0, y: 0 },
  { text: "Events", x: 0, y: 0 },
  { text: "About", x: 0, y: 0 },
];

/** The name of the place under the pointer, or an empty string. */
export const hover = { text: "" };

/** A project the page is pointing at (a slot under the pointer), whose exhibit lights up. */
export const highlight = { project: "" };

/**
 * A caption the page draws over the world, pinned to something in it: where it goes on screen in
 * CSS pixels, and what it says. The scene moves it every frame.
 */
export const caption = { on: false, x: 0, y: 0, title: "", text: "" };

/**
 * Something the page did that the world should answer: a note was sent, a chip was picked.
 * `at` is when, by the page's clock in milliseconds, so the world can time its answer from it.
 */
export const cue = { kind: "", id: "", at: 0 };

/**
 * The mailbox at the camp, as the scene leaves it. Times are the page's clock, in milliseconds.
 * - `flagAt`: when a note landed in it and its flag began to go up; 0 while the flag is down.
 * - `backAt`: when a note that did not send last came back to him.
 */
export const mailbox = { flagAt: 0, backAt: -1e9 };

/** Tells the world something happened. Firing an empty kind clears it. */
export function fire(kind: string, id = "") {
  cue.kind = kind;
  cue.id = id;
  cue.at = performance.now();
}
