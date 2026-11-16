"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { daylight } from "../daylight";
import { useMotion } from "../motion";
import { hash } from "./box";
import { groundY, isReserved } from "./terrain";

/** The moon, as a grid of pixels: # bright, + shaded crater, . empty. */
const MOON = [
  "..####..",
  ".######.",
  "###+####",
  "########",
  "####++##",
  "#+######",
  ".######.",
  "..####..",
];
/** Far off to the north-west, above the mountains, where every section's view has sky. */
const MOON_AT: [number, number, number] = [-48, 58, -115];
const MOON_PIXEL = 1.4;
/** Bright face and shaded craters. Shared, as there is only ever one moon. */
const MOON_LIGHT = [
  new THREE.MeshBasicMaterial({ color: "#fff6dc", transparent: true, fog: false, toneMapped: false }),
  new THREE.MeshBasicMaterial({ color: "#d9cfae", transparent: true, fog: false, toneMapped: false }),
];

/** A pixel moon that rises into view as night falls. */
export function Moon() {
  const group = useRef<THREE.Group>(null);
  const pixels = useMemo(
    () => MOON.flatMap((row, r) => [...row].flatMap((ch, c) => (ch === "." ? [] : [{ x: (c - 3.5) * MOON_PIXEL, y: (3.5 - r) * MOON_PIXEL, shade: ch === "+" ? 1 : 0 }]))),
    [],
  );

  useFrame(({ camera }) => {
    if (!group.current) return;
    group.current.visible = daylight.night > 0.02;
    // Always face the camera, so it is a flat disc from every side.
    group.current.quaternion.copy(camera.quaternion);
    group.current.position.set(MOON_AT[0], MOON_AT[1] - (1 - daylight.night) * 6, MOON_AT[2]);
    for (const material of MOON_LIGHT) material.opacity = daylight.night;
  });

  return (
    <group ref={group} position={MOON_AT} visible={false}>
      {pixels.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0]} scale={MOON_PIXEL} material={MOON_LIGHT[p.shade]}>
          <planeGeometry />
        </mesh>
      ))}
    </group>
  );
}

const COUNT = 36;
const FIREFLY_LIGHT = new THREE.MeshBasicMaterial({ color: "#e4ff8a", transparent: true, toneMapped: false });
const dummy = new THREE.Object3D();

/** Fireflies drifting over the grass near the woods and the river, only at night. */
export function Fireflies() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const animate = useMotion();

  // Scatter them over open grass in the valley, away from the paths and places.
  const flies = useMemo(() => {
    const out: { x: number; y: number; z: number; phase: number }[] = [];
    for (let i = 0; out.length < COUNT && i < 4000; i++) {
      const x = (hash(i, 3, 41) - 0.5) * 56;
      const z = (hash(i, 7, 42) - 0.5) * 56;
      if (Math.hypot(x, z) > 27 || isReserved(x, z, 0.5)) continue;
      out.push({ x, y: groundY(x, z) + 0.8 + hash(i, 9, 43) * 1.6, z, phase: hash(i, 11, 44) * 6.28 });
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    flies.forEach((f, i) => {
      dummy.position.set(f.x, f.y, f.z);
      dummy.scale.setScalar(0.14);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [flies]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    m.visible = daylight.night > 0.05;
    FIREFLY_LIGHT.opacity = daylight.night;
    if (!m.visible || !animate) return;
    const t = clock.elapsedTime;
    flies.forEach((f, i) => {
      dummy.position.set(f.x + Math.sin(t * 0.5 + f.phase) * 0.8, f.y + Math.sin(t * 0.9 + f.phase * 2) * 0.35, f.z + Math.cos(t * 0.4 + f.phase) * 0.8);
      // Each one glows and fades on its own slow rhythm.
      dummy.scale.setScalar(0.14 * Math.max(0.15, Math.sin(t * 1.6 + f.phase * 3)));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, FIREFLY_LIGHT, flies.length]} visible={false}>
      <boxGeometry />
    </instancedMesh>
  );
}
