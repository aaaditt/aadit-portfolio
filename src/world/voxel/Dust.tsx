"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { useMotion } from "../motion";
import { walker } from "../walker";

const COUNT = 8;
/** How many blocks he covers between puffs. */
const EVERY = 2.4;
/** How long a puff lasts, in seconds. */
const LIFE = 0.45;

/** Little puffs of dust kicked up behind the character as he runs. */
export function Dust() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const puffs = useRef(Array.from({ length: COUNT }, () => ({ age: LIFE, x: 0, y: 0, z: 0 })));
  const since = useRef(0);
  const next = useRef(0);
  const animate = useMotion();

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.1);
    if (animate && walker.moving) {
      since.current += walker.speed * step;
      if (since.current > EVERY) {
        since.current = 0;
        const puff = puffs.current[next.current++ % COUNT];
        puff.age = 0;
        puff.x = walker.x;
        puff.y = walker.y;
        puff.z = walker.z;
      }
    }
    puffs.current.forEach((puff, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      puff.age += step;
      const u = puff.age / LIFE;
      mesh.visible = u < 1;
      if (u >= 1) return;
      // Rise and swell, then shrink away.
      mesh.position.set(puff.x, puff.y + 0.12 + u * 0.5, puff.z);
      mesh.scale.setScalar(0.24 + u * 0.3 - Math.max(0, u - 0.6));
    });
  });

  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)} visible={false}>
          <boxGeometry />
          <meshBasicMaterial color="#efe6cf" transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
