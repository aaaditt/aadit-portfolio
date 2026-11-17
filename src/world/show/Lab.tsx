"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { projectsIn } from "@/content/projects";
import type { SectionId } from "@/content/sections";
import { useMotion } from "../motion";
import { highlight } from "../overlayState";
import * as M from "../voxel/models";
import { plateau } from "../voxel/terrain";
import { Voxels } from "../voxel/Voxels";

const cube = new THREE.BoxGeometry(1, 1, 1);

/** How far the hood lifts, in radians, when the lab is open. */
const HOOD_OPEN = 0.72;
/** How bright a project's row and core are when nothing points at it. */
const RESTING = 0.7;

/**
 * The parts of the Code Lab that move.
 * - Its upper storey is a hood: it lifts while the visitor is at the lab, showing three glowing
 *   cores underneath, one per project.
 * - The board on its front wall lists the three projects, one row each.
 * A project's row and core brighten when it is open, or pointed at in the card.
 */
export function Lab({ current, project }: { current: SectionId; project: string | null }) {
  const animate = useMotion();
  const lab = plateau("code");
  const hood = useRef<THREE.Group>(null);
  const cores = useRef<(THREE.Mesh | null)[]>([]);
  const lift = useRef(0);
  const projects = useMemo(() => projectsIn("code"), []);
  const boxes = useMemo(() => M.labHood(), []);
  /** One material per project, shared by its row on the wall and its core. */
  const materials = useMemo(() => projects.map((p) => new THREE.MeshBasicMaterial({ color: p.colours[0], toneMapped: false })), [projects]);
  const levels = useRef(projects.map(() => RESTING));

  useFrame(({ clock }, delta) => {
    const step = Math.min(delta, 0.05);
    const ease = animate ? 1 - Math.exp(-5 * step) : 1;
    lift.current += ((current === "code" ? 1 : 0) - lift.current) * ease;
    // Hinged along its back edge, so the front comes up.
    if (hood.current) hood.current.rotation.x = -lift.current * HOOD_OPEN;

    projects.forEach((p, i) => {
      const pointed = p.id === highlight.project || p.id === project;
      levels.current[i] += ((pointed ? 1 : RESTING) - levels.current[i]) * (animate ? 1 - Math.exp(-12 * step) : 1);
      materials[i].color.set(p.colours[0]).multiplyScalar(levels.current[i]);
      const core = cores.current[i];
      // A core that is pointed at rises a little and turns.
      if (core) {
        core.position.y = M.LAB_CORES[i][1] + (levels.current[i] - RESTING) * 0.5;
        core.rotation.y = animate ? clock.elapsedTime * (pointed ? 1.6 : 0.3) + i : 0;
      }
    });
  });

  const [hx, hy, hz] = M.LAB_HINGE;

  return (
    <group position={[lab.x + 1, lab.h, lab.z - 1]}>
      <group ref={hood} position={[hx, hy, hz]}>
        <Voxels boxes={boxes} />
      </group>
      {projects.map((p, i) => {
        const [cx, cy, cz] = M.LAB_CORES[i];
        const [rx, ry, rz] = M.LAB_ROWS[i];
        return (
          <group key={p.id}>
            <mesh ref={(el) => void (cores.current[i] = el)} geometry={cube} material={materials[i]} position={[cx, cy, cz]} scale={[0.8, 1.3, 0.8]} />
            {/* Its row on the board: a square of its colour, then two lines standing for its name. */}
            <mesh geometry={cube} material={materials[i]} position={[rx + 0.17, ry + 0.17, rz]} scale={[0.34, 0.34, 0.06]} />
            <mesh geometry={cube} material={materials[i]} position={[rx + 0.6 + (1.5 + i * 0.5) / 2, ry + 0.27, rz]} scale={[1.5 + i * 0.5, 0.14, 0.06]} />
            <mesh geometry={cube} material={materials[i]} position={[rx + 0.6 + (2.6 - i * 0.6) / 2, ry + 0.04, rz]} scale={[2.6 - i * 0.6, 0.1, 0.06]} />
          </group>
        );
      })}
    </group>
  );
}
