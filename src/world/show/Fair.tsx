"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Project } from "@/content/projects";
import { sfx } from "@/audio/engine";
import { useMotion } from "../motion";
import { table } from "../sheetStore";
import { hash } from "../voxel/box";
import type { Exhibit } from "../voxel/exhibitData";
import * as M from "../voxel/models";
import { groundY } from "../voxel/terrain";
import { Voxels } from "../voxel/Voxels";
import { STALLS, countAt, crowdAt, crowdInAfter, crowdSize } from "./fairRule";
import { pin, unpin } from "./pin";

const cube = new THREE.BoxGeometry(1, 1, 1);
const dummy = new THREE.Object3D();
const tint = new THREE.Color();

const SKIN = ["#d9a37a", "#a9744b", "#e3b58e", "#8b5a3c", "#c98d63"];
const SHIRTS = ["#f5f3ea", "#3a3f4d", "#e79aa0", "#4f86c6", "#9bbf4f"];
const LEGS = "#3a3f4d";

/** Each person is four blocks: legs, body, head and hair. Size, then height of its middle off the ground. */
const BUILD = [
  { size: [0.42, 0.56, 0.3], y: 0.28 },
  { size: [0.6, 0.7, 0.4], y: 0.91 },
  { size: [0.46, 0.46, 0.46], y: 1.49 },
  { size: [0.52, 0.2, 0.52], y: 1.76 },
] as const;

const HAIR = ["#1f1a1b", "#3b2e2a", "#6f4e37", "#22252b"];

/**
 * An event's fair. When the event is opened its cart unpacks: stalls pop up either side, a crowd
 * walks in and gathers in front, and a counter above the cart runs up to the number who really
 * came. He takes the mic. It all packs away on leaving.
 */
export function Fair({ exhibit, y, project, open }: { exhibit: Exhibit; y: number; project: Project; open: boolean }) {
  const animate = useMotion();
  const attendance = project.show!.attendance!;
  const count = crowdSize(attendance);
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const stalls = useRef<(THREE.Group | null)[]>([]);
  /** How big each person is drawn, easing in and out. */
  const sizes = useRef(new Float32Array(count));
  const springs = useRef(STALLS.map(() => ({ size: 0, speed: 0 })));
  const openedAt = useRef(-1);
  const cheered = useRef(false);
  const stall = useMemo(() => M.stall(project.colours), [project.colours]);
  const materials = useMemo(() => BUILD.map(() => new THREE.MeshStandardMaterial({ roughness: 1 })), []);

  // Dress the crowd: mostly in the event's own colours, with a few others mixed in.
  useLayoutEffect(() => {
    const [legs, bodies, heads, hair] = meshes.current;
    if (!legs || !bodies || !heads || !hair) return;
    const seed = exhibit.id.length + exhibit.id.charCodeAt(exhibit.id.length - 1);
    for (let i = 0; i < count; i++) {
      legs.setColorAt(i, tint.set(LEGS));
      const pick = hash(i, 3, seed);
      bodies.setColorAt(i, tint.set(pick < 0.6 ? project.colours[i % 3] : SHIRTS[Math.floor(hash(i, 5, seed) * SHIRTS.length)]));
      heads.setColorAt(i, tint.set(SKIN[Math.floor(hash(i, 7, seed) * SKIN.length)]));
      hair.setColorAt(i, tint.set(HAIR[Math.floor(hash(i, 9, seed) * HAIR.length)]));
    }
    for (const mesh of [legs, bodies, heads, hair]) if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, exhibit.id, project.colours]);

  // Leaving the event takes the counter down.
  useEffect(() => {
    if (!open) return;
    const who = exhibit.id;
    return () => {
      unpin(who);
      if (table.exhibit === who) table.exhibit = "";
    };
  }, [open, exhibit.id]);

  useFrame(({ clock, camera, size }, delta) => {
    const step = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    if (open && openedAt.current < 0) {
      openedAt.current = t;
      cheered.current = false;
    }
    if (!open) openedAt.current = -1;
    if (open) table.exhibit = exhibit.id;
    const since = open ? t - openedAt.current : 0;
    const ease = animate ? 1 - Math.exp(-10 * step) : 1;

    // The crowd.
    let anyone = false;
    for (let i = 0; i < count; i++) {
      const person = crowdAt(i, { open, since, still: !animate });
      const now = (sizes.current[i] += (person.size - sizes.current[i]) * ease);
      if (now > 0.02) anyone = true;
      const x = exhibit.x + person.x;
      const z = exhibit.z + person.z;
      // Bouncing along while walking in; a slower bob of excitement once there.
      const hop = !animate ? 0 : person.arrived ? Math.abs(Math.sin(t * 4 + i * 1.7)) * 0.1 : Math.abs(Math.sin(t * 11 + i)) * 0.07;
      const ground = groundY(x, z) + hop;
      BUILD.forEach((piece, k) => {
        const mesh = meshes.current[k];
        if (!mesh) return;
        dummy.position.set(x, ground + piece.y * now, z);
        // Everyone faces the cart.
        dummy.rotation.set(0, Math.atan2(-person.x, -person.z), 0);
        dummy.scale.set(piece.size[0] * now, piece.size[1] * now, piece.size[2] * now);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
    }
    meshes.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.visible = anyone;
      mesh.instanceMatrix.needsUpdate = true;
    });

    // The stalls pop up with a bounce, and fold away.
    STALLS.forEach((place, i) => {
      const group = stalls.current[i];
      const spring = springs.current[i];
      if (!group) return;
      const want = open && (!animate || since > place.after) ? 1 : 0;
      if (animate) {
        spring.speed += ((want - spring.size) * 220 - spring.speed * 16) * step;
        spring.size = Math.max(0, spring.size + spring.speed * step);
      } else {
        spring.size = want;
      }
      group.visible = spring.size > 0.03;
      group.scale.setScalar(Math.max(spring.size, 0.001));
    });

    if (open) {
      pin(exhibit.id, "Came along", `${countAt(attendance, animate ? since : 99)} people`, exhibit.x, y + 3, exhibit.z, camera, size);
      // Everyone is in: a cheer, and he throws a hand up.
      if (!cheered.current && (!animate || since >= crowdInAfter(count))) {
        cheered.current = true;
        table.flick = t;
        if (animate) sfx.chime();
      }
    }
  });

  return (
    <>
      {BUILD.map((_, k) => (
        <instancedMesh key={k} ref={(el) => void (meshes.current[k] = el)} args={[cube, materials[k], count]} visible={false} frustumCulled={false} />
      ))}
      {STALLS.map((place, i) => (
        <group key={i} ref={(el) => void (stalls.current[i] = el)} position={[exhibit.x + place.x, y, exhibit.z + place.z]} visible={false}>
          <Voxels boxes={stall} />
        </group>
      ))}
    </>
  );
}
