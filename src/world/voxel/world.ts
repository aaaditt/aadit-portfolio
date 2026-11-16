import { b, hash, place, type Box } from "./box";
import * as M from "./models";
import { HALF, forestAt, groundAt, heightAt, isReserved, plateau, riverZ, type Ground } from "./terrain";

const TOP: Record<Ground, string[]> = {
  grass: ["#86c25a", "#7ab852", "#92cc64", "#80bd56"],
  sand: ["#e3d2a0", "#dccb97"],
  path: ["#c7a878", "#bf9f70", "#cdb083"],
  stone: ["#a39382", "#978877", "#9c8c7b"],
  snow: ["#f4f6f5", "#eceff0"],
  bed: ["#c9bb8c", "#bfb183"],
};

const BODY: Record<Ground, string> = {
  grass: "#8a6748",
  sand: "#cdbb86",
  path: "#8a6748",
  // Rock and snow use nearly the same colour on top and sides, so slopes read as solid, not striped.
  stone: "#8e7f6f",
  snow: "#dfe6ea",
  bed: "#b3a57a",
};

const HIGH_ROCK = ["#8c8fa6", "#7d819a", "#868aa0"];

export type World = {
  /** Ground columns. */
  terrain: Box[];
  /** Everything standing on the ground that never moves. */
  props: Box[];
  /** Flowers and grass: too small to be worth casting shadows. */
  plants: Box[];
  /** Small lit things: screens, lamps, stage lights. Drawn at full brightness. */
  glow: Box[];
  /** Things lit only at night: windows, torch flames, lanterns. They fade in as night falls. */
  nightGlow: Box[];
};

/** The warm light in a window at night. */
export const WINDOW_LIGHT = "#ffc070";

/** How many rooms have a light on at night. */
const LIT_SHARE = 0.68;

/**
 * Gives every window a cross of glazing bars, and lights about two in three of them at night
 * with a pane made a hair thicker than the glass on both faces, so the light covers it from
 * inside and out whichever way the building is turned. The bars sit in front of the light.
 */
function windowLights(props: Box[]): Box[] {
  const panes = props.filter(([, , , w, , d, c]) => c === M.K.glass && Math.min(w, d) <= 0.2);
  const lights: Box[] = [];
  for (const [x, y, z, w, h, d] of panes) {
    const across = w < d; // true when the window faces east or west
    const cx = x + w / 2;
    const cy = y + h / 2;
    const cz = z + d / 2;
    const bar = 0.09;
    if (across) props.push(b(x - 0.05, y, cz - bar / 2, w + 0.1, h, bar, M.K.timber), b(x - 0.05, cy - bar / 2, z, w + 0.1, bar, d, M.K.timber));
    else props.push(b(cx - bar / 2, y, z - 0.05, bar, h, d + 0.1, M.K.timber), b(x, cy - bar / 2, z - 0.05, w, bar, d + 0.1, M.K.timber));
    if (hash(Math.round(cx * 10), Math.round(cz * 10), Math.round(cy * 10)) > LIT_SHARE) continue;
    lights.push(across ? b(x - 0.03, y, z, w + 0.06, h, d, WINDOW_LIGHT) : b(x, y, z - 0.03, w, h, d + 0.06, WINDOW_LIGHT));
  }
  return lights;
}

function buildTerrain(): Box[] {
  const out: Box[] = [];
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      const h = heightAt(x, z);
      const ground = groundAt(x, z);
      // Rock comes in two strata: warm brown low down, cool blue-grey higher up.
      const high = ground === "stone" && h >= 13;
      const tones = high ? HIGH_ROCK : TOP[ground];
      const top = tones[Math.floor(hash(x, z, 9) * tones.length)];
      // A cap in the surface colour. Below it, earth or rock, but only as far down as a
      // lower neighbour could let you see, which skips most of the hidden blocks.
      out.push(b(x, h - 1, z, 1, 1, 1, top));
      const lowest = Math.min(heightAt(x - 1, z), heightAt(x + 1, z), heightAt(x, z - 1), heightAt(x, z + 1));
      const edge = x === -HALF || x === HALF - 1 || z === -HALF || z === HALF - 1;
      const bottom = edge ? -3 : Math.max(-1, lowest - 1);
      if (bottom < h - 1) out.push(b(x, bottom, z, 1, h - 1 - bottom, 1, high ? "#7d819a" : BODY[ground]));
    }
  }
  return out;
}

function scatter(props: Box[], plants: Box[]) {
  const petals = [M.K.coral, M.K.yellow, M.K.pink, M.K.white, M.K.orange];
  for (let x = -HALF + 1; x < HALF - 1; x++) {
    for (let z = -HALF + 1; z < HALF - 1; z++) {
      const ground = groundAt(x, z);
      const h = heightAt(x, z);
      const roll = hash(x, z, 21);
      const at: [number, number, number] = [x + 0.5, h, z + 0.5];

      if (ground === "stone" || ground === "snow") {
        // Sparse pines and boulders on the mountainsides; nothing on the highest peaks.
        if (h < 20 && roll < 0.035 && hash(x, z, 22) < 0.8) props.push(...place(M.pine(x + z, ground === "snow"), at));
        else if (roll > 0.985) props.push(...place(M.rock(), at));
        continue;
      }
      if (ground !== "grass") continue;

      const reserved = isReserved(x, z);
      if (!reserved) {
        const woods = forestAt(x, z);
        const density = woods > 0.55 ? 0.2 : woods > 0.4 ? 0.07 : 0.018;
        // Trees need a clear neighbour so trunks never touch.
        if (roll < density && (x + z) % 2 === 0) {
          const kind = hash(x, z, 23);
          // A few trees are in autumn colour or blossom, to break up the green.
          const special = hash(x, z, 27);
          const leaves = special < 0.05 ? M.AUTUMN : special < 0.09 ? M.BLOSSOM : undefined;
          props.push(...place(h >= 6 || kind < 0.3 ? M.pine(x * 3 + z) : M.tree(x * 5 + z, leaves), at));
          continue;
        }
        if (roll > 0.992) {
          props.push(...place(M.rock(), at, Math.floor(hash(x, z, 24) * 4)));
          continue;
        }
        if (roll > 0.975) {
          props.push(...place(M.bush(), at));
          continue;
        }
      }
      // Keep the ground round the character clear, so nothing pokes up in front of him.
      if (Math.hypot(x - 1.2, z - 27.2) < 4) continue;
      const small = hash(x, z, 25);
      if (small < 0.07) plants.push(...place(M.flower(petals[Math.floor(hash(x, z, 26) * petals.length)]), [x + 0.3 + small * 4, h, z + 0.5]));
      else if (small < 0.17) plants.push(...place(M.tuft(), at));
    }
  }
}

function buildWorld(): World {
  const props: Box[] = [];
  const glow: Box[] = [];
  const add = (model: { solid: Box[]; glow: Box[] }, at: [number, number, number], turns = 0) => {
    props.push(...place(model.solid, at, turns));
    glow.push(...place(model.glow, at, turns));
  };

  const design = plateau("design");
  const code = plateau("code");
  const play = plateau("play");
  const lookout = plateau("lookout");
  const plaza = plateau("plaza");

  add(M.studio(), [design.x + 0.5, design.h, design.z - 1]);
  add(M.lab(), [code.x + 1, code.h, code.z - 1]);
  add(M.arcade(), [play.x, play.h, play.z + 1]);
  props.push(...place(M.camp(), [lookout.x, lookout.h, lookout.z]));
  props.push(...place(M.well(), [plaza.x, plaza.h, plaza.z]));

  const a = plateau("cottage-a");
  const bb = plateau("cottage-b");
  const c = plateau("cottage-c");
  props.push(...place(M.cottage(M.K.teal, M.K.tealD), [a.x, a.h, a.z]));
  props.push(...place(M.cottage(M.K.coral, M.K.coralD), [bb.x, bb.h, bb.z]));
  props.push(...place(M.cottage(M.K.yellow, M.K.gold), [c.x, c.h, c.z], 3));

  const farm = plateau("farm");
  props.push(...place(M.farm(), [farm.x, farm.h, farm.z]));
  const mill = plateau("windmill");
  props.push(...place(M.windmillTower(), [mill.x, mill.h, mill.z]));

  // The bridge carries the main path over the river, with a lantern at each corner.
  props.push(...place(M.bridge(9), [0.5, 1.7, riverZ(0)]));

  const nightGlow: Box[] = [];
  const lit = (model: { solid: Box[]; flame: Box[] }, at: [number, number, number]) => {
    props.push(...place(model.solid, at));
    nightGlow.push(...place(model.flame, at));
  };
  for (const x of [-1.25, 1.95]) for (const z of [riverZ(0) - 4.3, riverZ(0) + 4.3]) lit(M.lantern(), [x, 3.05, z]);
  // Torches either side of each landmark's door, and one by the signpost at the lookout.
  const torchAt = (x: number, z: number) => lit(M.torch(), [x, heightAt(Math.floor(x), Math.floor(z)), z]);
  for (const [x, z] of [[-15.6, -5.4], [-12.9, -5.4], [19.9, -5.4], [22.3, -5.4], [-2.8, -20.6], [2.8, -20.6], [3.6, 21.6]] as const) torchAt(x, z);

  // Lamps along the main path and around the plaza.
  for (const [x, z] of [[2.2, 15], [-1.8, 2], [-4, -4], [4.5, -10], [-2.2, -13.5]] as const) {
    add(M.lamp(), [x, heightAt(Math.floor(x), Math.floor(z)), z]);
  }

  const plants: Box[] = [];
  scatter(props, plants);
  nightGlow.push(...windowLights(props));
  return { terrain: buildTerrain(), props, plants, glow, nightGlow };
}

let cached: World | null = null;

/** The whole world, built once. It is the same on every visit. */
export function getWorld(): World {
  cached ??= buildWorld();
  return cached;
}
