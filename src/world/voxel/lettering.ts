import { b, type Box } from "./box";

/** A tiny three-by-five pixel font, just the letters the signs need. */
export const GLYPHS: Record<string, string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"],
  N: ["##.", "#.#", "#.#", "#.#", "#.#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  F: ["###", "#..", "##.", "#..", "#.."],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  W: ["#.#", "#.#", "###", "###", "#.#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["##.", "..#", ".#.", "..#", "##."],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "##.", "..#", "##."],
  "6": [".##", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "##."],
  "+": ["...", ".#.", "###", ".#.", "..."],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
};

/** How wide a word is when drawn with pixels of the given size. */
export const textWidth = (text: string, pixel: number) => (text.length * 4 - 1) * pixel;

/**
 * A word in raised pixels, facing +z, centred left to right on the origin and standing on y = 0.
 * Each pixel is a small block `pixel` across and a little deep.
 */
export function pixelText(text: string, pixel: number, color: string): Box[] {
  const out: Box[] = [];
  const left = -textWidth(text, pixel) / 2;
  [...text.toUpperCase()].forEach((letter, n) => {
    const rows = GLYPHS[letter];
    if (!rows) return;
    rows.forEach((row, r) => {
      [...row].forEach((cell, c) => {
        if (cell === "#") out.push(b(left + (n * 4 + c) * pixel, (4 - r) * pixel, 0, pixel, pixel, pixel * 0.6, color));
      });
    });
  });
  return out;
}
