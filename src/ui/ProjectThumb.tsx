import type { Project } from "@/content/projects";

/** A small repeatable number in [0, 1) from a word and a seed. */
function noise(word: string, seed: number) {
  let n = seed * 2654435761;
  for (const ch of word) n = Math.imul(n ^ ch.charCodeAt(0), 2246822519) >>> 0;
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
}

const W = 12;
const H = 9;

/** A trophy, for games and events. */
const SPRITE = ["..#######..", "#.#######.#", "#.#######.#", ".#.#####.#.", "...#####...", "....###....", ".....#.....", "...#####..."];

type Cell = { x: number; y: number; w: number; h: number; fill: string };

/** The pixel picture for a project, in the style of its exhibit: a painting, a screen of code, or a game. */
function cells(p: Project): { background: string; cells: Cell[] } {
  const [a, b, c] = p.colours;
  if (p.section === "design") {
    // A little abstract painting: a few blocks of colour on canvas, placed by the project's name.
    const out: Cell[] = [];
    [a, b, c, a].forEach((fill, i) => {
      const w = 3 + Math.floor(noise(p.id, i * 4) * 4);
      const h = 2 + Math.floor(noise(p.id, i * 4 + 1) * 4);
      out.push({ x: Math.floor(noise(p.id, i * 4 + 2) * (W - w)), y: Math.floor(noise(p.id, i * 4 + 3) * (H - h)), w, h, fill });
    });
    return { background: "#f5f3ea", cells: out };
  }
  if (p.section === "code") {
    // Lines of code on a dark screen, indented and coloured.
    const out: Cell[] = [];
    for (let line = 0; line < 4; line++) {
      const indent = 1 + Math.floor(noise(p.id, line) * 3);
      const w = 3 + Math.floor(noise(p.id, line + 10) * (W - indent - 4));
      out.push({ x: indent, y: 1 + line * 2, w, h: 1, fill: [a, b, c, b][line] });
    }
    return { background: "#22252b", cells: out };
  }
  // A game or event: a trophy on a coloured screen, with a score bar.
  const out: Cell[] = [];
  SPRITE.forEach((row, y) => [...row].forEach((ch, x) => ch === "#" && out.push({ x: x + 0.5, y: y + 0.5, w: 1, h: 1, fill: b })));
  out.push({ x: 0.5, y: 0, w: 4, h: 0.5, fill: c });
  return { background: a, cells: out };
}

/** A project's pixel picture. It scales to the width it is given and keeps its pixels crisp. */
export function ProjectThumb({ project, className }: { project: Project; className?: string }) {
  const art = cells(project);
  return (
    // The whole picture always shows; any spare room around it is filled with its background colour.
    <svg
      className={className}
      style={{ background: art.background }}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width={W} height={H} fill={art.background} />
      {art.cells.map((cell, i) => (
        <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h} fill={cell.fill} />
      ))}
    </svg>
  );
}
