"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { SECTIONS, type SectionId } from "@/content/sections";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { hover } from "../overlayState";
import type { Box } from "./box";
import { EXHIBITS, type Exhibit } from "./exhibitData";
import * as M from "./models";
import { heightAt } from "./terrain";
import { Voxels } from "./Voxels";

const PAINTINGS: [string, string, string][] = [
  [M.K.coral, M.K.yellow, M.K.teal],
  [M.K.blue, M.K.pink, M.K.gold],
  [M.K.leaf, M.K.orange, M.K.navy],
];
const ACCENTS = [M.K.yellow, M.K.pink, M.K.orange];
const CABINETS: [string, string][] = [
  [M.K.teal, "#9be7c4"],
  [M.K.navy, "#ffd27a"],
  [M.K.orange, "#bfe9ff"],
];

function model(e: Exhibit, nth: number): { solid: Box[]; glow: Box[] } {
  if (e.kind === "easel") return { solid: M.easel(PAINTINGS[nth]), glow: [] };
  if (e.kind === "terminal") return M.terminal(ACCENTS[nth]);
  return M.cabinet(...CABINETS[nth]);
}

/** How much bigger an exhibit gets under the pointer. */
const SWELL = 0.14;

/**
 * The easels, terminals and cabinets in front of each landmark. Each bounces and lights up
 * under the pointer, and clicking one opens its section.
 */
export function Exhibits({ current, onOpen }: { current: SectionId; onOpen: (href: string) => void }) {
  const animate = useMotion();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const light = useRef<THREE.PointLight>(null);
  /** Which exhibit is under the pointer, if any. */
  const hovered = useRef(-1);
  /** Each exhibit's size and how fast it is changing, for the bounce. */
  const springs = useRef(EXHIBITS.map(() => ({ size: 1, speed: 0 })));

  const items = useMemo(
    () =>
      EXHIBITS.map((e, i) => ({
        ...e,
        y: heightAt(Math.floor(e.x), Math.floor(e.z)),
        model: model(e, i % 3),
        section: SECTIONS.find((s) => s.id === e.section)!,
      })),
    [],
  );

  // Never leave the pointer cursor or a name tag behind.
  useEffect(
    () => () => {
      hover.text = "";
      document.body.style.cursor = "";
    },
    [],
  );

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    springs.current.forEach((spring, i) => {
      const group = groups.current[i];
      if (!group) return;
      const want = hovered.current === i ? 1 + SWELL : 1;
      if (animate) {
        // A loose spring, so it overshoots and wobbles once before settling.
        spring.speed += ((want - spring.size) * 260 - spring.speed * 11) * step;
        spring.size += spring.speed * step;
      } else {
        spring.size = want;
      }
      group.scale.set(spring.size, 2 - spring.size, spring.size);
      group.position.y = items[i].y + Math.max(0, spring.size - 1) * 2.2;
    });

    if (light.current) {
      const on = hovered.current >= 0;
      if (on) {
        const item = items[hovered.current];
        light.current.position.set(item.x, item.y + 2.4, item.z + 1.4);
      }
      light.current.intensity += ((on ? 9 : 0) - light.current.intensity) * (1 - Math.exp(-14 * step));
    }
  });

  return (
    <>
      {items.map((item, i) => (
        <group key={item.id}>
          <group ref={(el) => void (groups.current[i] = el)} position={[item.x, item.y, item.z]}>
            <Voxels boxes={item.model.solid} />
            <Voxels boxes={item.model.glow} glow />
          </group>
          <mesh
            position={[item.x, item.y + 1.3, item.z + 0.1]}
            onPointerOver={(event) => {
              event.stopPropagation();
              if (intro.get() !== "done") return;
              hovered.current = i;
              if (item.section.id !== current) {
                hover.text = item.section.title;
                document.body.style.cursor = "pointer";
              }
            }}
            onPointerOut={() => {
              if (hovered.current === i) hovered.current = -1;
              hover.text = "";
              document.body.style.cursor = "";
            }}
            onClick={(event) => {
              event.stopPropagation();
              // Letting go after turning the view is not a click.
              if (wasDrag()) return;
              if (intro.get() !== "done" || item.section.id === current) return;
              hover.text = "";
              document.body.style.cursor = "";
              onOpen(item.section.href);
            }}
          >
            <boxGeometry args={[2.1, 2.6, 1.6]} />
            {/* Drawn fully see-through: it is there to be pointed at, not seen. */}
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <pointLight ref={light} color="#fff1c4" intensity={0} distance={7} />
    </>
  );
}
