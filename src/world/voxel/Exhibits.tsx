"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { projectFor, type Project } from "@/content/projects";
import { SECTIONS } from "@/content/sections";
import { sfx } from "@/audio/engine";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { daylight } from "../daylight";
import { highlight, hover } from "../overlayState";
import { walker } from "../walker";
import type { Box } from "./box";
import { EXHIBITS, type Exhibit } from "./exhibitData";
import { Fair } from "../show/Fair";
import { Machine } from "../show/Machine";
import { Lightbox } from "../show/Lightbox";
import * as M from "./models";
import { heightAt } from "./terrain";
import { Voxels } from "./Voxels";
import { Sparks, Work } from "./Work";

/**
 * An exhibit's model, painted in its project's colours: the body, the finished piece that is
 * swapped for live work while he works at it (see Work), and glowing parts that always show.
 */
function model(e: Exhibit, project: Project): { solid: Box[]; swap: Box[]; keep: Box[] } {
  const [a, b, c] = project.colours;
  if (e.kind === "easel") {
    const easel = M.easel([a, b, c]);
    // The last four blocks are the paint on the canvas.
    return { solid: easel.slice(0, -4), swap: easel.slice(-4), keep: [] };
  }
  if (e.kind === "terminal") {
    const terminal = M.terminal(a);
    return { solid: terminal.solid, swap: terminal.glow, keep: [] };
  }
  const cart = M.cart(a, b);
  return { solid: cart.solid, swap: [], keep: cart.glow };
}

/** How much bigger an exhibit gets under the pointer. */
const SWELL = 0.14;

/**
 * The easels, terminals and carts in front of each landmark, one per project. Each bounces and
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
  /** The exhibit he was last seen working at, to notice the moment he gets to a new one. */
  const workedAt = useRef<string | null>(null);

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

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    // He has just got to an exhibit and starts work: it gives a little hop of welcome.
    const at = walker.moving ? null : walker.exhibit;
    if (at !== workedAt.current) {
      const i = items.findIndex((item) => item.id === at);
      if (i >= 0 && animate) springs.current[i].speed += 2.4;
      workedAt.current = at;
    }
    springs.current.forEach((spring, i) => {
      const group = groups.current[i];
      if (!group) return;
      const pointed = hovered.current === i || items[i].project.id === highlight.project;
      const want = pointed ? 1 + SWELL : selected === i ? 1 + SWELL * 0.5 : 1;
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
      const fromPage = items.findIndex((item) => item.project.id === highlight.project);
      const lit = hovered.current >= 0 ? hovered.current : fromPage >= 0 ? fromPage : selected;
      const on = lit >= 0;
      if (on) {
        const item = items[lit];
        // Low and close in, so it lights the exhibit rather than the face of whoever is at it.
        light.current.position.set(item.x, item.y + 1.5, item.z + 1.1);
      }
      // Softer on the exhibit he is working at, where it would only wash out his work and his
      // face, and softer again at night, when the lanterns are lit.
      const busy = on && items[lit].id === walker.exhibit;
      const strength = (busy ? 0.8 : 6) * (1 - daylight.night * 0.4);
      light.current.intensity += ((on ? strength : 0) - light.current.intensity) * (1 - Math.exp(-14 * step));
    }
  });

  return (
    <>
      {items.map((item, i) => (
        <group key={item.id}>
          <group ref={(el) => void (groups.current[i] = el)} position={[item.x, item.y, item.z]}>
            <Voxels boxes={item.model.solid} />
            <Work exhibit={EXHIBITS[i]} y={item.y} colours={item.project.colours} swap={item.model.swap} keep={item.model.keep} finished={Boolean(item.project.show)} />
          </group>
          {/* Whatever the project has to show is built here from its own facts when it is opened. */}
          {item.project.show?.sheets && <Lightbox exhibit={EXHIBITS[i]} y={item.y} project={item.project} open={selected === i} />}
          {item.project.show?.parts && <Machine exhibit={EXHIBITS[i]} y={item.y} project={item.project} open={selected === i} />}
          {item.project.show?.attendance && <Fair exhibit={EXHIBITS[i]} y={item.y} project={item.project} open={selected === i} />}
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
      <Sparks />
      <pointLight ref={light} color="#fff1c4" intensity={0} distance={7} />
    </>
  );
}
