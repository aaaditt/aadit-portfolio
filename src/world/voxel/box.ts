/** One block: its lowest corner (x, y, z), its size (w, h, d) and its colour. */
export type Box = [x: number, y: number, z: number, w: number, h: number, d: number, color: string];

export const b = (x: number, y: number, z: number, w: number, h: number, d: number, color: string): Box => [
  x, y, z, w, h, d, color,
];

/**
 * Moves a model into the world. `turns` rotates it in quarter turns about its own origin,
 * which keeps every block lined up with the grid.
 */
export function place(model: Box[], at: [number, number, number], turns = 0, scale = 1): Box[] {
  const t = ((turns % 4) + 4) % 4;
  return model.map(([x, y, z, w, h, d, c]) => {
    let nx = x;
    let nz = z;
    let nw = w;
    let nd = d;
    if (t === 1) {
      nx = z;
      nz = -(x + w);
      nw = d;
      nd = w;
    } else if (t === 2) {
      nx = -(x + w);
      nz = -(z + d);
    } else if (t === 3) {
      nx = -(z + d);
      nz = x;
      nw = d;
      nd = w;
    }
    return [at[0] + nx * scale, at[1] + y * scale, at[2] + nz * scale, nw * scale, h * scale, nd * scale, c];
  });
}

/** A repeatable pseudo-random number in [0, 1) for a grid position. */
export function hash(x: number, z: number, seed = 0): number {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
