"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { exhibitFor, projectFor, type Project } from "@/content/projects";
import { SECTIONS } from "@/content/sections";
import { sfx } from "@/audio/engine";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { walker } from "../walker";
import { hover } from "../overlayState";
import type { Box } from "./box";
import { EXHIBITS, type Exhibit } from "./exhibitData";
import * as M from "./models";
import { heightAt } from "./terrain";
import { Voxels } from "./Voxels";

/** An exhibit's model, painted in its project's colours. */
function model(e: Exhibit, project: Project): { solid: Box[]; glow: Box[] } {
  const [a, b, c] = project.colours;
  if (e.kind === "easel") return { solid: M.easel([a, b, c]), glow: [] };
  if (e.kind === "terminal") return M.terminal(a);
  return M.cabinet(a, b);
}

/** How much bigger an exhibit gets under the pointer. */
const SWELL = 0.14;

/**
 * The easels, terminals and cabinets in front of each landmark, one per project. Each bounces and
 * lights up under the pointer, clicking one opens its project, and the open project's stays lit.
 */
export function Exhibits({ project, onOpen }: { project: string | null; onOpen: (href: string) => void }) {
  const animate = useMotion();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const light = useRef<THREE.PointLight>(null);
  /** Which exhibit is under the pointer, if any. */
  const hovered = useRef(-1);
  /** Each exhibit's size and how fast it is changing, for the bounce. */
  const springs = useRef(EXHIBITS.map(() => ({ size: 1, speed: 0 })));

  const items = useMemo(
    () =>
      EXHIBITS.map((e) => {
        const work = projectFor(e.id);
        return {
          ...e,
          y: heightAt(Math.floor(e.x), Math.floor(e.z)),
          model: model(e, work),
          project: work,
          section: SECTIONS.find((s) => s.id === e.section)!,
        };
      }),
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

  const selected = items.findIndex((item) => item.project.id === project);

  // While a project is open, he turns to face its exhibit.
  useEffect(() => {
    const exhibit = project ? exhibitFor(project) : undefined;
    walker.focus = exhibit ? { x: exhibit.x, z: exhibit.z } : null;
  }, [project]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    springs.current.forEach((spring, i) => {
      const group = groups.current[i];
      if (!group) return;
      const want = hovered.current === i ? 1 + SWELL : selected === i ? 1 + SWELL * 0.5 : 1;
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
      const lit = hovered.current >= 0 ? hovered.current : selected;
      const on = lit >= 0;
      if (on) {
        const item = items[lit];
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
              if (item.project.id !== project) {
                hover.text = item.project.title;
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
              if (intro.get() !== "done" || item.project.id === project) return;
              hover.text = "";
              document.body.style.cursor = "";
              sfx.click();
              onOpen(`${item.section.href}/${item.project.id}`);
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
