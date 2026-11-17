"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLUBS } from "@/content/about";
import type { SectionId } from "@/content/sections";
import { sfx } from "@/audio/engine";
import { wasDrag } from "../orbit";
import { intro } from "../introStore";
import { useMotion } from "../motion";
import { hover } from "../overlayState";
import { banners } from "../pickStore";
import { table } from "../sheetStore";
import * as M from "../voxel/models";
import { plateau } from "../voxel/terrain";
import { Voxels } from "../voxel/Voxels";
import { stageLight } from "./fairRule";
import { pin, unpin } from "./pin";

const cube = new THREE.BoxGeometry(1, 1, 1);

/** Where the Grounds' own units are measured from, in the world (see world.ts). */
function origin(): [number, number, number] {
  const at = plateau("events");
  return [at.x, at.h, at.z + 1];
}

/** The stage's row of lights: steady most of the time, chasing while an event is on show. */
export function StageLights() {
  const animate = useMotion();
  const [ox, oy, oz] = origin();
  const materials = useMemo(() => M.STAGE_LIGHTS.map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false })), []);

  useFrame(({ clock }) => {
    const chasing = animate && table.exhibit.startsWith("events-");
    materials.forEach((material, i) => {
      const bright = stageLight(i, materials.length, clock.elapsedTime, chasing);
      material.color.set(M.STAGE_LIGHTS[i]).multiplyScalar(0.3 + 0.7 * bright);
    });
  });

  return (
    <>
      {materials.map((material, i) => {
        const [x, y, z] = M.stageLightAt(i);
        return <mesh key={i} geometry={cube} material={material} position={[ox + x, oy + y, oz + z]} scale={[0.4, 0.35, 0.4]} />;
      })}
    </>
  );
}

/** How high a banner flies: low on its pole until picked, then run up to the top. */
const LOW = 1.35;
const HIGH = 3.65;
const FLAG = { w: 1, h: 1.25 };

/**
 * The club banners on poles in front of the stage, one for each club or role. Picking one, here
 * or in the card, runs it up its pole and names it; he salutes it.
 */
export function Banners({ current }: { current: SectionId }) {
  const animate = useMotion();
  const [ox, oy, oz] = origin();
  const pole = useMemo(() => M.bannerPole(), []);
  const flags = useRef<(THREE.Group | null)[]>([]);
  const heights = useRef(CLUBS.map(() => LOW));
  const here = current === "events";

  // Leaving the Grounds lowers the banners.
  useEffect(() => {
    if (!here) return;
    return () => {
      banners.clear();
      unpin("banners");
      hover.text = "";
      document.body.style.cursor = "";
    };
  }, [here]);

  useFrame(({ clock, camera, size }, delta) => {
    const ease = animate ? 1 - Math.exp(-7 * Math.min(delta, 0.05)) : 1;
    const picked = here ? CLUBS.findIndex((c) => c.id === banners.get()) : -1;
    CLUBS.forEach((_, i) => {
      const flag = flags.current[i];
      if (!flag) return;
      const up = picked === i;
      heights.current[i] += ((up ? HIGH : LOW) - heights.current[i]) * ease;
      flag.position.y = heights.current[i];
      // A raised banner flaps; the others hang nearly still.
      flag.rotation.y = animate ? Math.sin(clock.elapsedTime * (up ? 5 : 1.4) + i) * (up ? 0.22 : 0.05) : 0;
    });
    if (picked >= 0) {
      const [x, z] = M.bannerAt(picked);
      const club = CLUBS[picked];
      pin("banners", club.name, `${club.role} · ${club.when}`, ox + x + FLAG.w / 2, oy + heights.current[picked] + FLAG.h / 2 + 0.2, oz + z, camera, size);
    } else {
      unpin("banners");
    }
  });

  return (
    <>
      {CLUBS.map((club, i) => {
        const [x, z] = M.bannerAt(i);
        return (
          <group key={club.id} position={[ox + x, oy, oz + z]}>
            <Voxels boxes={pole} />
            <group ref={(el) => void (flags.current[i] = el)} position={[0, LOW, 0]}>
              <mesh geometry={cube} position={[0.08 + FLAG.w / 2, 0, 0]} scale={[FLAG.w, FLAG.h, 0.08]} castShadow>
                <meshStandardMaterial color={club.colour} roughness={1} />
              </mesh>
              <mesh geometry={cube} position={[0.08 + FLAG.w / 2, 0.1, 0.05]} scale={[FLAG.w * 0.5, FLAG.h * 0.35, 0.04]}>
                <meshStandardMaterial color="#f5f3ea" roughness={1} />
              </mesh>
            </group>
            {here && (
              <mesh
                position={[0.5, 2.4, 0]}
                onPointerOver={(event) => {
                  event.stopPropagation();
                  if (intro.get() !== "done") return;
                  hover.text = club.id === banners.get() ? "" : club.name;
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
                  sfx.click();
                  banners.pick(club.id);
                }}
              >
                <boxGeometry args={[1.5, 4.8, 0.8]} />
                {/* Drawn fully see-through: it is there to be pointed at, not seen. */}
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}

/** Where a club's banner is in the world: he turns to it to salute. */
export function bannerSpot(id: string): { x: number; z: number } | null {
  const i = CLUBS.findIndex((c) => c.id === id);
  if (i < 0) return null;
  const [ox, , oz] = origin();
  const [x, z] = M.bannerAt(i);
  return { x: ox + x, z: oz + z };
}
