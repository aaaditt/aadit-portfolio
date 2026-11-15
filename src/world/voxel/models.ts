import { b, type Box } from "./box";

/** Every colour used by the models. */
export const K = {
  cream: "#efe3c8",
  creamD: "#dfd0ac",
  timber: "#6f4e37",
  wood: "#8b6b4a",
  woodD: "#5e4630",
  coral: "#c8553d",
  coralD: "#a8432f",
  teal: "#2f7f79",
  tealD: "#25655f",
  navy: "#27374d",
  navyD: "#1c2838",
  glass: "#9fd3e6",
  stone: "#9aa0a6",
  stoneD: "#7d848b",
  stoneL: "#c3c7c9",
  leaf: "#4f9a4d",
  leafD: "#3d7f3f",
  leafL: "#66ad5b",
  pine: "#2f6f4f",
  pineD: "#245a41",
  yellow: "#e8c15a",
  white: "#f5f3ea",
  red: "#d2493a",
  pink: "#e79aa0",
  orange: "#e58f3c",
  black: "#22252b",
  soil: "#6d4c35",
  crop: "#9bbf4f",
  gold: "#e3b341",
  fire: "#ffb347",
  blue: "#4f86c6",
} as const;

export function tree(variant: number): Box[] {
  const h = 3 + (variant % 2);
  const [a, c, l] = variant % 3 === 0 ? [K.leafD, K.leaf, K.leafL] : [K.leaf, K.leafD, K.leafL];
  return [
    b(-0.5, 0, -0.5, 1, h, 1, K.wood),
    b(-1.5, h - 1, -1.5, 3, 2, 3, a),
    b(-2.5, h - 1, -0.5, 5, 1, 1, c),
    b(-0.5, h - 1, -2.5, 1, 1, 5, c),
    b(-1, h + 1, -1, 2, 1, 2, l),
  ];
}

export function pine(variant: number, snowy = false): Box[] {
  const top = snowy ? K.white : K.pine;
  const t = variant % 2;
  return [
    b(-0.5, 0, -0.5, 1, 2 + t, 1, K.woodD),
    b(-2.5, 2 + t, -1.5, 5, 1, 3, K.pineD),
    b(-1.5, 2 + t, -2.5, 3, 1, 5, K.pineD),
    b(-1.5, 3 + t, -1.5, 3, 1, 3, K.pine),
    b(-1.5, 4 + t, -0.5, 3, 1, 1, K.pineD),
    b(-0.5, 4 + t, -1.5, 1, 1, 3, K.pineD),
    b(-0.5, 5 + t, -0.5, 1, 2, 1, top),
  ];
}

export const bush = (): Box[] => [b(-0.5, 0, -0.5, 1.4, 0.8, 1, K.leafD), b(0, 0.5, -0.2, 0.8, 0.6, 0.8, K.leaf)];

export const rock = (): Box[] => [b(-1, 0, -0.5, 2, 1, 1.4, K.stone), b(-0.2, 0.8, -0.2, 1, 0.6, 0.9, K.stoneD)];

export const flower = (color: string): Box[] => [
  b(-0.08, 0, -0.08, 0.16, 0.45, 0.16, K.leafD),
  b(-0.2, 0.45, -0.2, 0.4, 0.35, 0.4, color),
];

export const tuft = (): Box[] => [b(-0.3, 0, -0.1, 0.2, 0.5, 0.2, K.leafL), b(0.1, 0, 0.1, 0.2, 0.7, 0.2, K.leaf)];

export function lamp(): { solid: Box[]; glow: Box[] } {
  return {
    solid: [b(-0.3, 0, -0.3, 0.6, 0.3, 0.6, K.navyD), b(-0.12, 0.3, -0.12, 0.24, 2.6, 0.24, K.navyD), b(-0.45, 3.5, -0.45, 0.9, 0.2, 0.9, K.navyD)],
    glow: [b(-0.3, 2.9, -0.3, 0.6, 0.6, 0.6, K.fire)],
  };
}

function gableRoof(width: number, depth: number, y: number, a: string, d: string): Box[] {
  const out: Box[] = [];
  for (let k = 0; depth + 1 - 2 * k > 0; k++) {
    out.push(b(-width / 2 - 0.5, y + k, -(depth + 1) / 2 + k, width + 1, 1, depth + 1 - 2 * k, k % 2 ? d : a));
  }
  return out;
}

export function cottage(roof: string, roofD: string): Box[] {
  return [
    b(-3, 0, -2.5, 6, 3, 5, K.cream),
    b(-3.1, 0, -2.6, 6.2, 0.5, 5.2, K.stone),
    ...[-3.1, 2.7].flatMap((x) => [-2.6, 2.2].map((z) => b(x, 0, z, 0.4, 3, 0.4, K.timber))),
    ...gableRoof(6, 5, 3, roof, roofD),
    b(-0.5, 0, 2.5, 1, 2, 0.15, K.timber),
    b(-2.3, 1.2, 2.5, 1, 1, 0.12, K.glass),
    b(1.3, 1.2, 2.5, 1, 1, 0.12, K.glass),
    b(1.4, 4, -1.6, 1, 2.6, 1, K.stoneD),
  ];
}

/** The Design Studio: a timber-framed workshop with an easel outside and a giant pencil beside it. */
export function studio(): { solid: Box[]; glow: Box[] } {
  const paints = [K.coral, K.yellow, K.teal, K.blue];
  return {
    solid: [
      b(-4.5, 0, -3, 9, 4, 6, K.cream),
      b(-4.6, 0, -3.1, 9.2, 0.6, 6.2, K.stone),
      ...[-4.6, -0.2, 4.2].flatMap((x) => [-3.1, 2.7].map((z) => b(x, 0, z, 0.4, 4, 0.4, K.timber))),
      b(-4.6, 3.6, 2.7, 9.2, 0.4, 0.4, K.timber),
      ...gableRoof(9, 6, 4, K.coral, K.coralD),
      b(2.4, 5, -2, 1, 3.4, 1, K.stoneD),
      // the big studio window
      b(-3.7, 1.1, 3, 3.2, 2.1, 0.12, K.glass),
      b(-3.8, 1, 3, 3.4, 0.14, 0.2, K.timber),
      b(-2.17, 1.1, 3, 0.14, 2.1, 0.2, K.timber),
      // door and striped awning
      b(1.6, 0, 3, 1.4, 2.5, 0.15, K.teal),
      b(2.7, 1.2, 3.1, 0.15, 0.15, 0.1, K.gold),
      ...Array.from({ length: 6 }, (_, i) => b(1.2 + i * 0.37, 2.7, 3, 0.37, 0.2, 1.1, i % 2 ? K.white : K.coral)),
      // easel with a pixel painting
      b(-6.9, 0, 3.6, 0.15, 2.4, 0.15, K.wood),
      b(-5.3, 0, 3.6, 0.15, 2.4, 0.15, K.wood),
      b(-6.1, 0, 3, 0.15, 2.2, 0.15, K.wood),
      b(-7, 0.9, 3.75, 1.9, 1.5, 0.12, K.white),
      b(-6.8, 1.1, 3.87, 0.6, 0.5, 0.05, K.blue),
      b(-6.2, 1.1, 3.87, 0.9, 0.3, 0.05, K.leaf),
      b(-5.9, 1.7, 3.87, 0.45, 0.45, 0.05, K.yellow),
      b(-6.7, 1.6, 3.87, 0.5, 0.6, 0.05, K.coral),
      // paint buckets
      ...paints.flatMap((c, i) => [b(-4.6 + i * 0.75, 0, 4.2 + (i % 2) * 0.4, 0.55, 0.5, 0.55, K.stoneL), b(-4.52 + i * 0.75, 0.5, 4.28 + (i % 2) * 0.4, 0.4, 0.08, 0.4, c)]),
      // giant pencil, point up
      b(5.8, 0, -0.7, 1.4, 0.8, 1.4, K.pink),
      b(5.75, 0.8, -0.75, 1.5, 0.4, 1.5, K.stoneL),
      b(5.8, 1.2, -0.7, 1.4, 5.3, 1.4, K.yellow),
      b(5.8, 1.2, -0.7, 0.3, 5.3, 1.4, K.gold),
      b(5.95, 6.5, -0.55, 1.1, 0.6, 1.1, K.creamD),
      b(6.15, 7.1, -0.35, 0.7, 0.5, 0.7, K.creamD),
      b(6.3, 7.6, -0.2, 0.4, 0.6, 0.4, K.black),
    ],
    glow: [],
  };
}

const BRACKETS = ["..#...#.#..", ".#...#...#.", "#....#....#", ".#..#....#.", "..#.#...#.."];

/** The Code Lab: a two-storey block with a wall of code, an aerial, servers and a `</>` sculpture. */
export function lab(): { solid: Box[]; glow: Box[] } {
  const lines = [K.yellow, K.glass, K.pink, K.crop, K.glass, K.yellow];
  const px = 0.62;
  return {
    solid: [
      b(-4.5, 0, -3, 9, 4, 6, K.navy),
      b(-4.6, 0, -3.1, 9.2, 0.5, 6.2, K.navyD),
      b(-4.7, 4, -3.2, 9.4, 0.4, 6.4, K.white),
      b(-3.5, 4.4, -2, 5, 3, 4, K.teal),
      b(-3.6, 7.4, -2.1, 5.2, 0.35, 4.2, K.white),
      b(-2.6, 5.2, 2, 3.2, 1.4, 0.12, K.glass),
      b(-3.6, 0.9, 3, 5.2, 2.6, 0.12, K.black),
      b(2.4, 0, 3, 1.4, 2.5, 0.15, K.orange),
      // aerial and dish
      b(2.6, 4.4, -1.2, 0.3, 4.4, 0.3, K.stoneL),
      b(2.3, 6.8, -1.2, 0.9, 0.15, 0.3, K.stoneL),
      b(0.3, 7.75, 0.2, 1.6, 0.3, 1.6, K.stoneL),
      b(0.5, 8.05, 0.4, 1.2, 0.3, 1.2, K.white),
      // server racks outside
      ...[0, 1].flatMap((i) => [b(5.2 + i * 1.5, 0, 1.2, 1.2, 2.6, 1.2, K.stoneL), b(5.2 + i * 1.5, 2.6, 1.2, 1.2, 0.15, 1.2, K.stoneD)]),
      // the </> sculpture, on a plinth
      b(-9.6, 0, 3.4, BRACKETS[0].length * px + 0.6, 0.5, 1.4, K.stoneD),
      ...BRACKETS.flatMap((row, r) =>
        [...row].flatMap((ch, c) => (ch === "#" ? [b(-9.3 + c * px, 0.5 + (4 - r) * px, 3.8, px, px, 0.6, K.white)] : [])),
      ),
    ],
    glow: [
      ...lines.map((c, i) => b(-3.3 + (i % 3) * 0.35, 3.05 - i * 0.37, 3.1, 1.6 + ((i * 37) % 23) / 10, 0.16, 0.06, c)),
      b(2.55, 8.8, -1.25, 0.4, 0.4, 0.4, K.red),
      ...[0, 1].flatMap((i) => [0, 1, 2].flatMap((r) => [b(5.35 + i * 1.5, 0.5 + r * 0.75, 2.4, 0.18, 0.18, 0.06, K.crop), b(5.7 + i * 1.5, 0.5 + r * 0.75, 2.4, 0.18, 0.18, 0.06, r === 1 ? K.red : K.gold)])),
    ],
  };
}

const FACE = ["#.....#", ".#...#.", "#######", "##.#.##", "#######", "#.#.#.#"];

/** The Arcade: a giant cabinet, a striped event tent, and a stage with lights. */
export function arcade(): { solid: Box[]; glow: Box[] } {
  const bunting = [K.coral, K.yellow, K.teal, K.orange, K.pink];
  const lights = [K.red, K.gold, K.glass, K.pink, K.crop];
  return {
    solid: [
      // giant cabinet
      b(-2, 0, -4.5, 4, 7.5, 3, K.red),
      b(-2.2, 0, -4.5, 0.2, 7.5, 3.2, K.coralD),
      b(2, 0, -4.5, 0.2, 7.5, 3.2, K.coralD),
      b(-1.6, 3.6, -1.5, 3.2, 2.5, 0.12, K.black),
      b(-2, 2.7, -1.5, 4, 0.6, 1.2, K.white),
      b(-1.3, 3.3, -0.9, 0.2, 0.6, 0.2, K.black),
      b(-1.45, 3.9, -1.05, 0.5, 0.45, 0.5, K.red),
      b(0.2, 3.3, -0.9, 0.45, 0.2, 0.45, K.teal),
      b(0.95, 3.3, -0.9, 0.45, 0.2, 0.45, K.yellow),
      b(-0.4, 1.2, -1.5, 0.8, 0.9, 0.1, K.black),
      // striped tent
      ...Array.from({ length: 7 }, (_, i) => b(-13 + i, 0, -3.5, 1, 3, 7, i % 2 ? K.coral : K.cream)),
      ...[0, 1, 2, 3].map((k) => b(-13.5 + k, 3 + k, -4 + k, 8 - 2 * k, 1, 8 - 2 * k, k % 2 ? K.cream : K.orange)),
      b(-9.65, 7, -0.15, 0.3, 2, 0.3, K.woodD),
      b(-9.35, 8.2, -0.1, 1.2, 0.7, 0.15, K.teal),
      b(-10.2, 0, 3.5, 1.4, 2.4, 0.15, K.navyD),
      // stage
      b(6, 0, -4, 8, 1, 5, K.wood),
      b(6, 1, -4, 8, 0.15, 5, K.woodD),
      b(6.2, 1, -3.8, 0.4, 5, 0.4, K.stoneD),
      b(13.4, 1, -3.8, 0.4, 5, 0.4, K.stoneD),
      b(6.2, 5.8, -3.8, 7.6, 0.4, 0.4, K.stoneD),
      b(6.8, 1.15, -3.2, 1.3, 2.4, 1.2, K.black),
      b(11.9, 1.15, -3.2, 1.3, 2.4, 1.2, K.black),
      b(9.6, 1.15, -1.2, 0.2, 1.8, 0.2, K.stoneL),
      // bunting on poles
      b(-5, 0, 3.5, 0.3, 4.5, 0.3, K.wood),
      b(5, 0, 3.5, 0.3, 4.5, 0.3, K.wood),
      ...Array.from({ length: 11 }, (_, i) => {
        const t = (i + 0.5) / 11;
        return b(-4.7 + t * 9.4, 4 - Math.sin(t * Math.PI) * 0.9, 3.55, 0.45, 0.5, 0.12, bunting[i % bunting.length]);
      }),
      // a dice to sit on
      b(3.4, 0, 1.4, 1.2, 1.2, 1.2, K.white),
      b(3.85, 0.45, 2.6, 0.3, 0.3, 0.06, K.black),
    ],
    glow: [
      b(-2, 6.3, -1.5, 4, 0.9, 0.3, K.gold),
      ...FACE.flatMap((row, r) =>
        [...row].flatMap((ch, c) => (ch === "#" ? [b(-1.05 + c * 0.3, 5.6 - r * 0.3, -1.42, 0.3, 0.3, 0.06, K.crop)] : [])),
      ),
      ...lights.map((c, i) => b(7 + i * 1.45, 5.45, -3.7, 0.4, 0.35, 0.4, c)),
      b(7.1, 2.2, -2, 0.7, 0.7, 0.06, K.stoneD),
      b(12.2, 2.2, -2, 0.7, 0.7, 0.06, K.stoneD),
    ],
  };
}

/** The lookout camp: a small tent, a log bench, a signpost, a mailbox and a flag. */
export function camp(): Box[] {
  return [
    // tent
    ...[0, 1, 2].map((k) => b(-5.2 + k * 0.5, k, -3.2, 3.4 - k, 1, 3, k % 2 ? K.creamD : K.orange)),
    b(-4, 0, -0.2, 1, 1.6, 0.1, K.navyD),
    // log bench
    b(-4.2, 0, 1.6, 0.5, 0.5, 0.6, K.woodD),
    b(-2.3, 0, 1.6, 0.5, 0.5, 0.6, K.woodD),
    b(-4.4, 0.5, 1.5, 2.8, 0.4, 0.8, K.wood),
    // signpost
    b(3.2, 0, 2.4, 0.3, 3.2, 0.3, K.woodD),
    b(3.4, 2.5, 2.35, 1.6, 0.5, 0.2, K.teal),
    b(1.8, 1.8, 2.35, 1.5, 0.5, 0.2, K.coral),
    b(3.4, 1.1, 2.35, 1.3, 0.5, 0.2, K.yellow),
    // mailbox
    b(-4.4, 0, 3.4, 0.3, 1.4, 0.3, K.wood),
    b(-4.75, 1.4, 3.1, 1, 0.8, 0.9, K.red),
    b(-3.75, 1.7, 3.4, 0.12, 0.7, 0.3, K.gold),
    // flagpole
    b(4.35, 0, -2.4, 0.3, 6, 0.3, K.stoneL),
    b(4.65, 4.6, -2.35, 2, 1.2, 0.15, K.coral),
    b(4.65, 5, -2.33, 2, 0.4, 0.17, K.white),
    // fire ring
    b(-0.9, 0, 0.6, 1.8, 0.3, 0.4, K.stoneD),
    b(-0.9, 0, 2, 1.8, 0.3, 0.4, K.stoneD),
    b(-0.9, 0, 1, 0.4, 0.3, 1, K.stoneD),
    b(0.5, 0, 1, 0.4, 0.3, 1, K.stoneD),
    b(-0.45, 0, 1.05, 0.9, 0.3, 0.25, K.woodD),
    b(-0.15, 0, 1, 0.25, 0.3, 0.95, K.wood),
  ];
}

export function well(): Box[] {
  return [
    b(-1.5, 0, -1.5, 3, 1, 0.7, K.stone),
    b(-1.5, 0, 0.8, 3, 1, 0.7, K.stone),
    b(-1.5, 0, -0.8, 0.7, 1, 1.6, K.stoneD),
    b(0.8, 0, -0.8, 0.7, 1, 1.6, K.stoneD),
    b(-0.8, 0.3, -0.8, 1.6, 0.3, 1.6, K.blue),
    b(-1.4, 1, -0.15, 0.3, 2.2, 0.3, K.woodD),
    b(1.1, 1, -0.15, 0.3, 2.2, 0.3, K.woodD),
    b(-1.9, 3.2, -1.2, 3.8, 0.4, 2.4, K.coral),
    b(-1.5, 3.6, -0.7, 3, 0.4, 1.4, K.coralD),
  ];
}

export function farm(): Box[] {
  const out: Box[] = [b(-4, 0, -3.5, 8, 0.25, 7, K.soil)];
  for (let row = 0; row < 5; row++) {
    for (let i = 0; i < 9; i++) {
      const ripe = (row + i) % 3 === 0;
      out.push(b(-3.6 + i * 0.82, 0.25, -3 + row * 1.35, 0.4, ripe ? 0.9 : 0.6, 0.4, ripe ? K.gold : K.crop));
    }
  }
  // fence
  for (let i = 0; i <= 8; i += 2) out.push(b(-4.3 + i * 1.03, 0, 3.7, 0.25, 1.1, 0.25, K.wood));
  out.push(b(-4.3, 0.65, 3.75, 8.5, 0.18, 0.15, K.wood));
  // scarecrow
  out.push(b(3.1, 0.25, -0.1, 0.2, 2, 0.2, K.woodD), b(2.4, 1.5, -0.1, 1.6, 0.2, 0.2, K.woodD), b(2.85, 2.2, -0.3, 0.7, 0.7, 0.6, K.gold), b(2.7, 2.9, -0.4, 1, 0.2, 0.8, K.woodD));
  return out;
}

export function windmillTower(): Box[] {
  return [
    b(-2, 0, -2, 4, 3, 4, K.cream),
    b(-1.5, 3, -1.5, 3, 3, 3, K.creamD),
    b(-1, 6, -1, 2, 2, 2, K.cream),
    b(-1.5, 8, -1.5, 3, 1, 3, K.coral),
    b(-1, 9, -1, 2, 0.7, 2, K.coralD),
    b(-0.5, 0, 2, 1, 2, 0.15, K.timber),
    b(-0.4, 4, 1.5, 0.8, 0.8, 0.12, K.glass),
    b(-0.3, 6.7, 1, 0.6, 0.6, 0.9, K.woodD),
  ];
}

/** Four sails, centred on the hub at the origin, facing +z. */
export function windmillSails(): Box[] {
  const out: Box[] = [b(-0.4, -0.4, 0, 0.8, 0.8, 0.5, K.woodD)];
  out.push(b(-0.15, 0.4, 0.15, 0.3, 5, 0.2, K.wood), b(0.15, 1.2, 0.15, 1.1, 4, 0.1, K.white));
  out.push(b(-0.15, -5.4, 0.15, 0.3, 5, 0.2, K.wood), b(-1.25, -5.2, 0.15, 1.1, 4, 0.1, K.white));
  out.push(b(0.4, -0.15, 0.15, 5, 0.3, 0.2, K.wood), b(1.2, -1.25, 0.15, 4, 1.1, 0.1, K.white));
  out.push(b(-5.4, -0.15, 0.15, 5, 0.3, 0.2, K.wood), b(-5.2, 0.15, 0.15, 4, 1.1, 0.1, K.white));
  return out;
}

/** A plank bridge running along z, centred on the origin. */
export function bridge(length: number): Box[] {
  const out: Box[] = [b(-1.6, 0, -length / 2, 3.2, 0.35, length, K.wood)];
  for (let z = -length / 2; z < length / 2; z += 1) out.push(b(-1.6, 0.35, z + 0.05, 3.2, 0.06, 0.1, K.woodD));
  for (const x of [-1.75, 1.45]) {
    for (let z = -length / 2; z <= length / 2 - 0.3; z += (length - 0.3) / 4) out.push(b(x, -1.4, z, 0.3, 2.9, 0.3, K.woodD));
    out.push(b(x + 0.05, 1.15, -length / 2, 0.2, 0.2, length, K.wood));
  }
  return out;
}

export function boat(): Box[] {
  return [
    b(-1.6, 0, -0.7, 3.2, 0.5, 1.4, K.wood),
    b(-2.1, 0.2, -0.45, 0.5, 0.4, 0.9, K.woodD),
    b(1.6, 0.2, -0.45, 0.5, 0.4, 0.9, K.woodD),
    b(-1.6, 0.5, -0.8, 3.2, 0.25, 0.2, K.woodD),
    b(-1.6, 0.5, 0.6, 3.2, 0.25, 0.2, K.woodD),
    b(-0.1, 0.5, -0.1, 0.2, 2.6, 0.2, K.woodD),
    b(0.1, 1.2, -0.05, 1.3, 1.8, 0.1, K.white),
    b(0.1, 1.2, -0.05, 1.3, 0.45, 0.12, K.coral),
  ];
}

/** A hot-air balloon, basket at the origin. */
export function balloon(): Box[] {
  const stripes = [K.coral, K.cream, K.coral, K.cream, K.coral];
  const widths = [2, 4, 5, 4, 2.4];
  const out: Box[] = [b(-0.7, 0, -0.7, 1.4, 1, 1.4, K.wood), b(-0.75, 0.9, -0.75, 1.5, 0.15, 1.5, K.woodD)];
  for (const x of [-0.65, 0.55]) for (const z of [-0.65, 0.55]) out.push(b(x, 1, z, 0.1, 1.6, 0.1, K.woodD));
  widths.forEach((w, i) => out.push(b(-w / 2, 2.6 + i * 1.3, -w / 2, w, 1.3, w, stripes[i])));
  return out;
}

export function cloud(variant: number): Box[] {
  const long = 6 + (variant % 3) * 2;
  return [
    b(-long / 2, 0, -1.5, long, 1, 3, K.white),
    b(-long / 2 + 1, 1, -1, long - 3, 1, 2, K.white),
    b(-long / 2 + 1.5, -0.6, -1, long - 2, 0.6, 2, "#e4eef2"),
    b(long / 2 - 1, 0.2, -0.8, 2, 0.8, 1.8, K.white),
  ];
}
