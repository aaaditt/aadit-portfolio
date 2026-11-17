"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SectionId } from "@/content/sections";
import { sfx } from "@/audio/engine";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { daylight } from "../daylight";
import { useMotion } from "../motion";
import { hover } from "../overlayState";
import { asked } from "../pickStore";
import { groundY } from "../voxel/terrain";
import { beamHeight, beamRise, beams } from "./valleyRule";

const cube = new THREE.BoxGeometry(1, 1, 1);

/** Each beam's colour: the place's own light. */
const COLOURS: Record<string, string> = { design: "#ffd9a0", code: "#8fe3ff", events: "#ffe2b0", clubs: "#9fc4ff" };

/** Where each beam's tag belongs on screen, in CSS pixels, written every frame for the page. */
export const beamLabels = beams().map(() => ({ x: 0, y: 0, on: false }));

const top = new THREE.Vector3();

/**
 * Light the valley. Asked "What have you done?", a beam of light rises from each place he has work
 * in, one after another, as tall as there is work there. Each is tagged on the page with how much
 * is there (see ValleyTags), and clicking a beam, or its tag, goes to that place.
 */
export function Beams({ current, onOpen }: { current: SectionId; onOpen: (href: string) => void }) {
  const animate = useMotion();
  const list = useMemo(() => beams(), []);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const askedAt = useRef(-1);
  const glow = useMemo(
    () =>
      list.map((b) => ({
        outer: new THREE.MeshBasicMaterial({ color: COLOURS[b.id], transparent: true, opacity: 0.18, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending }),
        pool: new THREE.MeshBasicMaterial({ color: COLOURS[b.id], transparent: true, opacity: 0.5, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending }),
        inner: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.7, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending }),
      })),
    [list],
  );

  // Never leave a name tag or pointer behind.
  useEffect(
    () => () => {
      hover.text = "";
      document.body.style.cursor = "";
      beamLabels.forEach((label) => (label.on = false));
    },
    [],
  );

  useFrame(({ clock, camera, size }) => {
    const on = current === "about" && asked.get() === "done";
    const t = clock.elapsedTime;
    if (on && askedAt.current < 0) askedAt.current = t;
    if (!on) askedAt.current = -1;
    list.forEach((beam, i) => {
      const group = groups.current[i];
      if (!group) return;
      const rise = on ? beamRise(i, t - askedAt.current, !animate) : 0;
      const height = beamHeight(beam.count);
      const ground = groundY(beam.x, beam.z);
      group.visible = rise > 0.01;
      group.position.set(beam.x, ground, beam.z);
      group.scale.set(1, Math.max(rise, 0.001), 1);
      // A slow shimmer, each beam a beat behind the last.
      const shimmer = animate ? 0.85 + Math.sin(t * 2.4 + i * 1.3) * 0.15 : 1;
      // At night the core burns brighter against the dark.
      glow[i].outer.opacity = 0.18 * shimmer;
      glow[i].inner.opacity = Math.min(1, 0.6 * (1 + daylight.night * 0.6)) * shimmer;
      // Where its tag goes: just above the top of the beam.
      top.set(beam.x, ground + height * rise + 1, beam.z).project(camera);
      beamLabels[i].x = (top.x * 0.5 + 0.5) * size.width;
      beamLabels[i].y = (-top.y * 0.5 + 0.5) * size.height;
      beamLabels[i].on = rise > 0.8 && top.z < 1;
    });
  });

  return (
    <>
      {list.map((beam, i) => {
        const height = beamHeight(beam.count);
        return (
          <group key={beam.id} ref={(el) => void (groups.current[i] = el)} visible={false}>
            {/* A soft outer column, a bright core, and a pool of light where it meets the ground. */}
            <mesh geometry={cube} material={glow[i].outer} position={[0, height / 2, 0]} scale={[1.4, height, 1.4]} />
            <mesh geometry={cube} material={glow[i].inner} position={[0, height / 2, 0]} scale={[0.5, height, 0.5]} />
            <mesh geometry={cube} material={glow[i].pool} position={[0, 0.05, 0]} scale={[3, 0.1, 3]} />
            <mesh
              position={[0, height / 2, 0]}
              onPointerOver={(event) => {
                event.stopPropagation();
                if (intro.get() !== "done") return;
                hover.text = `${beam.name}: ${beam.line}`;
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                hover.text = "";
                document.body.style.cursor = "";
              }}
              onClick={(event) => {
                event.stopPropagation();
                // Letting go after turning the view is not a click.
                if (wasDrag() || intro.get() !== "done") return;
                hover.text = "";
                document.body.style.cursor = "";
                sfx.click();
                onOpen(beam.href);
              }}
            >
              <boxGeometry args={[2.4, height, 2.4]} />
              {/* Drawn fully see-through: it is there to be clicked, not seen. */}
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
