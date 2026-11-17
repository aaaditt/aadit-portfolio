import type { CSSProperties } from "react";

/** Turns rows of "#" and "." into square pixels, `size` units each, for an SVG. */
export function pixels(rows: string[], size = 1) {
  return rows.flatMap((row, r) =>
    [...row].flatMap((cell, c) => (cell === "#" ? [<rect key={`${r}-${c}`} x={c * size} y={r * size} width={size} height={size} />] : [])),
  );
}

/** Seven-pixel-tall capitals for the name, with strokes two pixels thick. */
export const LETTERS: Record<string, string[]> = {
  A: [".####.", "##..##", "##..##", "######", "##..##", "##..##", "##..##"],
  D: ["#####.", "##..##", "##..##", "##..##", "##..##", "##..##", "#####."],
  I: ["####", ".##.", ".##.", ".##.", ".##.", ".##.", "####"],
  T: ["######", "..##..", "..##..", "..##..", "..##..", "..##..", "..##.."],
};

/**
 * One letter of the name, drawn on a pixel grid so it stays crisp at any size. It is as tall as
 * the surrounding text's cap height.
 */
export function PixelLetter({ letter, className, style }: { letter: string; className?: string; style?: CSSProperties }) {
  const rows = LETTERS[letter] ?? LETTERS.A;
  return (
    <svg
      className={className}
      style={{ height: "0.78em", width: `${(0.78 * rows[0].length) / 7}em`, overflow: "visible", ...style }}
      viewBox={`0 0 ${rows[0].length} 7`}
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {pixels(rows)}
    </svg>
  );
}

/**
 * The bar icons, on a 9-by-9 grid. Coarse on purpose: at bar size each pixel is about two screen
 * pixels, so the shapes read as pixel art rather than thin lines.
 */
export const ICON_ROWS = {
  home: ["....#....", "...###...", "..##.##..", ".##...##.", "##.....##", ".#.....#.", ".#.##..#.", ".#.##..#.", ".#######."],
  design: ["......##.", ".....####", "....####.", "...####..", "..####...", ".####....", ".###.....", "##.......", "#........"],
  code: [".........", "....#....", "..#.#.#..", ".#..#..#.", "#..#....#", ".#.#...#.", "..##..#..", "...#.....", "........."],
  events: [".........", ".#######.", "##.####.#", "#...##.##", "##.####.#", "#########", "##.....##", "#.......#", "........."],
  about: ["...###...", "..#####..", "..#####..", "...###...", ".........", "..#####..", ".#######.", ".#######.", ".#######."],
  sun: ["#...#...#", ".#.....#.", "...###...", "..#####..", "#.#####.#", "..#####..", "...###...", ".#.....#.", "#...#...#"],
  moon: ["..#####..", ".####....", "####.....", "###......", "###......", "###......", "####.....", ".####....", "..#####.."],
};
