"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PROJECTS } from "@/content/projects";
import { useMotion } from "../motion";
import * as M from "../voxel/models";
import { plateau } from "../voxel/terrain";

const cube = new THREE.BoxGeometry(1, 1, 1);
const want = new THREE.Color();

/**
 * The paint in the studio's buckets. With a design project open it turns to that project's own
 * three colours, so the buckets hold what the piece was painted with.
 */
export function Buckets({ project }: { project: string | null }) {
  const animate = useMotion();
  const studio = plateau("design");
  const materials = useMemo(() => M.PAINTS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 })), []);

  useFrame((_, delta) => {
    const open = PROJECTS.find((p) => p.id === project && p.section === "design");
    const ease = animate ? 1 - Math.exp(-6 * Math.min(delta, 0.05)) : 1;
    materials.forEach((material, i) => {
      // Four buckets, three colours: the last holds a second helping of the middle one.
      want.set(open ? open.colours[i === 3 ? 1 : i] : M.PAINTS[i]);
      material.color.lerp(want, ease);
    });
  });

  return (
    <>
      {materials.map((material, i) => {
        const [x, y, z] = M.paintAt(i);
        return <mesh key={i} geometry={cube} material={material} position={[studio.x + 0.5 + x, studio.h + y, studio.z - 1 + z]} scale={[0.4, 0.08, 0.4]} />;
      })}
    </>
  );
}
