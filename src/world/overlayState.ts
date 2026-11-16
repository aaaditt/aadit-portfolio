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
  { text: "Play", x: 0, y: 0 },
  { text: "About", x: 0, y: 0 },
];

/** The name of the place under the pointer, or an empty string. */
export const hover = { text: "" };

/** A project the page is pointing at (a slot under the pointer), whose exhibit lights up. */
export const highlight = { project: "" };
