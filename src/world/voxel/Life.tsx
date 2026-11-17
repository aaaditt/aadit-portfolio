"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMotion } from "../motion";
import { stage } from "../stageStore";
import { walker } from "../walker";
import { b, type Box } from "./box";
import { groundY, plateau } from "./terrain";
import { Voxels } from "./Voxels";

function person(shirt: string, hair: string, skin: string): Box[] {
  return [
    b(-2, 0, -1, 1.7, 4, 2, "#3a3f4d"),
    b(0.3, 0, -1, 1.7, 4, 2, "#3a3f4d"),
    b(-2.5, 4, -1.5, 5, 5, 3, shirt),
    b(-2, 9, -2, 4, 4, 4, skin),
    b(-2.3, 12, -2.3, 4.6, 1.4, 4.6, hair),
    b(-2.3, 10, -2.3, 4.6, 2, 1.2, hair),
  ];
}

type Walker = { route: [number, number, number, number]; speed: number; phase: number; model: Box[] };

const WALKERS: Walker[] = [
  { route: [0.6, 15, 0.6, -5], speed: 1.5, phase: 0, model: person("#c8553d", "#3b2e2a", "#d9a37a") },
  { route: [-1, -7, -10.5, -8], speed: 1.3, phase: 0.4, model: person("#2f7f79", "#1f1a1b", "#a9744b") },
  { route: [1.5, -6.5, 10.5, -7.5], speed: 1.4, phase: 0.7, model: person("#e8c15a", "#6f4e37", "#e3b58e") },
  { route: [-0.8, -9, -0.8, -13.2], speed: 1.2, phase: 0.2, model: person("#4f86c6", "#22252b", "#8b5a3c") },
  { route: [-3, -23, 4, -21.5], speed: 1, phase: 0.55, model: person("#e79aa0", "#3b2e2a", "#c98d63") },
  { route: [8, -20, 12, -21], speed: 0.6, phase: 0.1, model: person("#f5f3ea", "#1f1a1b", "#a9744b") },
];

/** How close the character has to run past for a villager to stop and watch. */
const NOTICE = 7;
/** How much room they give him. */
const CLEAR = 1.7;

/**
 * Villagers strolling back and forth along the paths, slowing to a stop at each end.
 * When the character runs past, they stop and turn to watch him go.
 */
export function Villagers() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const animate = useMotion();
  /** How far round its circuit each villager is, and how fully each has stopped to watch (0 to 1). */
  const laps = useRef(WALKERS.map((w) => w.phase));
  const watching = useRef(WALKERS.map(() => 0));

  useFrame(({ clock }, delta) => {
    const step = Math.min(delta, 0.1);
    WALKERS.forEach((w, i) => {
      const group = refs.current[i];
      if (!group) return;
      const [x1, z1, x2, z2] = w.route;
      const length = Math.hypot(x2 - x1, z2 - z1);
      const watch = watching.current[i];
      if (animate) laps.current[i] += ((step * w.speed) / (length * 2)) * (1 - watch);
      const lap = laps.current[i];
      const tri = 1 - Math.abs(((lap % 1) + 1) % 1 * 2 - 1);
      // Ease in and out of each end, which reads as a short pause.
      const u = tri * tri * (3 - 2 * tri);
      const forward = (((lap % 1) + 1) % 1) < 0.5;
      let x = x1 + (x2 - x1) * u;
      let z = z1 + (z2 - z1) * u;
      // Step out of his way if he comes right at them.
      const gap = Math.hypot(x - walker.x, z - walker.z);
      if (gap < CLEAR && gap > 0.01) {
        x += ((x - walker.x) / gap) * (CLEAR - gap);
        z += ((z - walker.z) / gap) * (CLEAR - gap);
      }
      const moving = Math.sin(Math.PI * tri) * (1 - watch);
      const noticed = animate && walker.moving && Math.hypot(walker.x - x, walker.z - z) < NOTICE;
      watching.current[i] += ((noticed ? 1 : 0) - watch) * (1 - Math.exp(-(noticed ? 12 : 2.5) * step));
      group.position.set(x, groundY(x, z) + Math.abs(Math.sin(clock.elapsedTime * 9 + i)) * 0.07 * moving, z);
      // While a show is staged, only those close to it stay.
      group.visible = stage.level < 0.5 || Math.hypot(x - stage.x, z - stage.z) < 14;
      const ahead = Math.atan2(x2 - x1, z2 - z1) + (forward ? 0 : Math.PI);
      const towards = Math.atan2(walker.x - x, walker.z - z);
      group.rotation.y = ahead + Math.atan2(Math.sin(towards - ahead), Math.cos(towards - ahead)) * watch;
    });
  });

  return (
    <>
      {WALKERS.map((w, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)} scale={0.14}>
          <Voxels boxes={w.model} />
        </group>
      ))}
    </>
  );
}

const BIRD_BODY: Box[] = [b(-0.25, -0.12, -0.5, 0.5, 0.25, 1, "#2b3140")];
const BIRD_WING: Box[] = [b(0, -0.05, -0.3, 1.1, 0.1, 0.6, "#3a4254")];
const FLOCK: [number, number, number][] = [
  [0, 0, 0],
  [-1.8, 0.4, -1.6],
  [-1.8, -0.2, 1.6],
  [-3.6, 0.8, -3.2],
  [-3.6, 0.1, 3.2],
];

/** A small flock that crosses the sky every so often. */
export function Birds() {
  const flock = useRef<THREE.Group>(null);
  const wings = useRef<(THREE.Group | null)[]>([]);
  const animate = useMotion();

  useFrame(({ clock }) => {
    if (flock.current) flock.current.visible = stage.level < 0.5;
    if (!flock.current || !animate) return;
    const t = clock.elapsedTime;
    const lap = (t % 22) / 22;
    flock.current.position.set(-75 + lap * 150, 27 + Math.sin(t * 0.4) * 2, -14 + Math.sin(t * 0.2) * 10);
    wings.current.forEach((wing, i) => {
      if (wing) wing.rotation.z = (i % 2 ? -1 : 1) * Math.sin(t * 9 + Math.floor(i / 2)) * 0.7;
    });
  });

  return (
    <group ref={flock} position={[-75, 27, -14]} rotation={[0, Math.PI / 2, 0]}>
      {FLOCK.map((at, i) => (
        <group key={i} position={at}>
          <Voxels boxes={BIRD_BODY} shadows={false} />
          <group ref={(el) => void (wings.current[i * 2] = el)}>
            <Voxels boxes={BIRD_WING} shadows={false} />
          </group>
          <group ref={(el) => void (wings.current[i * 2 + 1] = el)} rotation={[0, Math.PI, 0]}>
            <Voxels boxes={BIRD_WING} shadows={false} />
          </group>
        </group>
      ))}
    </group>
  );
}

/** Puffs of smoke rising from the chimneys, looping. */
export function ChimneySmoke() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const animate = useMotion();

  const chimneys = useMemo<[number, number, number][]>(() => {
    const design = plateau("design");
    const a = plateau("cottage-a");
    const c = plateau("cottage-b");
    return [
      [design.x + 3.4, design.h + 8.5, design.z - 2.5],
      [a.x + 1.9, a.h + 6.7, a.z - 1.1],
      [c.x + 1.9, c.h + 6.7, c.z - 1.1],
    ];
  }, []);

  useFrame(({ clock }) => {
    refs.current.forEach((group) => {
      if (group) group.visible = stage.level < 0.5;
    });
    if (!animate) return;
    refs.current.forEach((group, g) => {
      group?.children.forEach((puff, i) => {
        const t = (clock.elapsedTime * 0.22 + i / 3 + g * 0.17) % 1;
        puff.position.set(Math.sin(t * 5 + i) * 0.25 + t * 0.8, t * 3.2, 0);
        puff.scale.setScalar(Math.max(0.01, 0.45 + t * 0.6 - Math.max(0, t - 0.75) * 4));
      });
    });
  });

  return (
    <>
      {chimneys.map((at, g) => (
        <group key={g} position={at} ref={(el) => void (refs.current[g] = el)}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i, 0]} scale={0.5}>
              <boxGeometry />
              <meshBasicMaterial color="#f4f2ec" transparent opacity={0.85} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
