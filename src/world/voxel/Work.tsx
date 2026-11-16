"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMotion } from "../motion";
import { walker } from "../walker";
import type { Box } from "./box";
import type { Exhibit } from "./exhibitData";
import { K } from "./models";
import { Voxels } from "./Voxels";
import { GAME, SCREEN, code, finishedBetween, game, painting, type Kind } from "./workLoop";

const cube = new THREE.BoxGeometry(1, 1, 1);

/** One material per colour, shared by every exhibit. Lit for paint, full brightness for screens. */
const paints = new Map<string, THREE.Material>();
const lights = new Map<string, THREE.Material>();
const paint = (c: string) => paints.get(c) ?? paints.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 1 })).get(c)!;
const light = (c: string) => lights.get(c) ?? lights.set(c, new THREE.MeshBasicMaterial({ color: c, toneMapped: false })).get(c)!;

/** The most marks any kind of work draws at once: five lines of code, a cursor and a "passed" bar. */
const MARKS = 7;

/** Where the sparkle comes from, above what he is working on, in the exhibit's own units. */
const SPARK_FROM: Record<Kind, [number, number, number]> = {
  easel: [0, 2.4, 0.4],
  terminal: [0, 2.35, 0.1],
  cabinet: [0, 2.7, 0.5],
};

const PLACE: Record<Exhibit["kind"], Kind> = { easel: "easel", terminal: "terminal", cabinet: "cabinet" };

/** A seed for each exhibit, so the three easels paint different pictures. */
const seedOf = (id: string) => [...id].reduce((n, ch) => n * 31 + ch.charCodeAt(0), 7) % 9973;

/**
 * The work on an exhibit. Standing still, it shows a finished piece. While he works at it, it
 * comes alive: a painting goes on stroke by stroke, code is typed and scrolls, or a game is played
 * with the ship following his hand on the stick. Each time the work is done, it sparkles.
 */
export function Work({
  exhibit,
  y,
  colours,
  swap,
  keep,
}: {
  exhibit: Exhibit;
  /** The ground under the exhibit. */
  y: number;
  colours: [string, string, string];
  /** The finished piece, hidden while it is being worked on. */
  swap: Box[];
  /** Glowing parts that always show, such as the cabinet's screen. */
  keep: Box[];
}) {
  const animate = useMotion();
  const still = useRef<THREE.Group>(null);
  const live = useRef<THREE.Group>(null);
  const marks = useRef<(THREE.Mesh | null)[]>([]);
  const last = useRef(0);
  const kind = PLACE[exhibit.kind];
  const seed = seedOf(exhibit.id);
  const [a, b, c] = colours;

  useFrame(({ clock }) => {
    const working = animate && !walker.moving && walker.exhibit === exhibit.id;
    if (still.current) still.current.visible = !working;
    if (live.current) live.current.visible = working;
    const t = clock.elapsedTime;
    if (!working) {
      last.current = t;
      return;
    }

    let used = 0;
    const draw = (x: number, yy: number, w: number, h: number, z: number, depth: number, material: THREE.Material) => {
      const mesh = marks.current[used++];
      if (!mesh) return;
      mesh.visible = true;
      mesh.material = material;
      mesh.position.set(x + w / 2, yy + h / 2, z + depth / 2);
      mesh.scale.set(Math.max(w, 0.001), Math.max(h, 0.001), depth);
    };

    if (kind === "easel") {
      // On the canvas face, each stroke drawn from its left edge as the brush moves across.
      for (const s of painting(t, seed)) draw(s.x, s.y, s.w * s.share, s.h, 0.36, 0.05, paint([a, b, c][s.colour]));
    } else if (kind === "terminal") {
      const screen = code(t, seed);
      const palette = [a, K.glass, K.crop, b];
      for (const line of screen.lines) draw(line.x, line.y, line.w, line.h, 0.05, 0.04, light(palette[line.colour]));
      if (screen.passed) {
        // It works: a green bar where the next line would go.
        draw(SCREEN.left, SCREEN.bottom, 0.55, SCREEN.height, 0.05, 0.045, light(K.crop));
      } else if (Math.floor(t * 4) % 2 === 0) {
        draw(screen.cursor.x + 0.02, screen.cursor.y, 0.07, SCREEN.height, 0.05, 0.045, light(K.white));
      }
    } else {
      const g = game(t, seed);
      // Over the screen's face: the score along the top, things falling, and his ship at the bottom.
      const z = 0.58;
      draw(GAME.left + 0.02, GAME.top - 0.05, (GAME.right - GAME.left - 0.04) * g.score, 0.03, z, 0.015, light(K.white));
      if (!g.won) for (const f of g.fallers) draw(f.x - 0.03, f.y - 0.03, 0.06, 0.06, z, 0.015, light(K.gold));
      draw(g.ship - 0.06, GAME.bottom + 0.02, 0.12, 0.07, z, 0.015, light(g.won ? K.gold : K.white));
    }
    for (let i = used; i < MARKS; i++) {
      const mesh = marks.current[i];
      if (mesh) mesh.visible = false;
    }

    if (finishedBetween(kind, last.current, t)) {
      const [dx, dy, dz] = SPARK_FROM[kind];
      sparkle(exhibit.x + dx, y + dy, exhibit.z + dz, colours);
    }
    last.current = t;
  });

  return (
    <>
      <group ref={still}>
        <Voxels boxes={swap} glow={kind !== "easel"} />
      </group>
      <Voxels boxes={keep} glow />
      <group ref={live} visible={false}>
        {Array.from({ length: MARKS }, (_, i) => (
          <mesh key={i} ref={(el) => void (marks.current[i] = el)} geometry={cube} visible={false} />
        ))}
      </group>
    </>
  );
}

// ---- Sparkle ----

const SPARKS = 14;
const SPARK_SECONDS = 1.1;
const GRAVITY = 7;

type Spark = { x: number; y: number; z: number; vx: number; vy: number; vz: number; spin: number };
const flying: Spark[] = Array.from({ length: SPARKS }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 }));
const burst = { at: -10, colours: ["#ffffff", "#ffffff", "#ffffff"] as string[], pending: false };

/** Sets off a little burst of pixel sparkle at a point, in the given colours. */
function sparkle(x: number, y: number, z: number, colours: string[]) {
  flying.forEach((s, i) => {
    const angle = (i / SPARKS) * Math.PI * 2 + Math.random() * 0.4;
    const out = 1.2 + Math.random() * 1.4;
    Object.assign(s, { x, y, z, vx: Math.cos(angle) * out, vy: 2.6 + Math.random() * 2.2, vz: Math.sin(angle) * out * 0.6, spin: (Math.random() - 0.5) * 12 });
  });
  burst.colours = colours;
  burst.pending = true;
}

/** Draws the sparkle. One burst at a time is plenty: he only works at one exhibit. */
export function Sparks() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }, delta) => {
    const step = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    if (burst.pending) {
      burst.pending = false;
      burst.at = t;
      meshes.current.forEach((mesh, i) => {
        if (mesh) mesh.material = light(burst.colours[i % burst.colours.length]);
      });
    }
    const age = t - burst.at;
    const alive = age < SPARK_SECONDS;
    meshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.visible = alive;
      if (!alive) return;
      const s = flying[i];
      s.vy -= GRAVITY * step;
      s.x += s.vx * step;
      s.y += s.vy * step;
      s.z += s.vz * step;
      mesh.position.set(s.x, s.y, s.z);
      mesh.rotation.set(age * s.spin, age * s.spin * 0.7, 0);
      // Pop up to full size, then shrink away.
      const size = 0.13 * Math.min(1, age * 10) * (1 - age / SPARK_SECONDS);
      mesh.scale.setScalar(Math.max(size, 0.001));
    });
  });

  return (
    <>
      {flying.map((_, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)} geometry={cube} visible={false} />
      ))}
    </>
  );
}
