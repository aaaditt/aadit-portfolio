"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bubbleAnchor } from "../bubbleAnchor";
import { useMotion } from "../motion";
import { b, type Box } from "./box";
import { Voxels } from "./Voxels";

// Colours taken from Aadit's profile picture: curly dark hair, navy hoodie.
const SKIN = "#a9744b";
const SKIN_D = "#93623e";
const HAIR = "#1f1a1b";
const HAIR_L = "#3b2e2a";
const HOODIE = "#34447a";
const HOODIE_D = "#2a3763";
const TEE = "#f1eee6";
const PANTS = "#2a2b33";
const SHOE = "#ecebe6";
const FACE = "#2a1d18";

/** One model pixel, in world units. The character is about 3.4 blocks tall. */
const U = 0.17;

const LEGS: Box[] = [
  b(-3, -5, -1.5, 2.6, 5, 3, PANTS),
  b(0.4, -5, -1.5, 2.6, 5, 3, PANTS),
  b(-3.1, -5.8, -1.5, 2.8, 0.8, 3.8, SHOE),
  b(0.3, -5.8, -1.5, 2.8, 0.8, 3.8, SHOE),
];

const TORSO: Box[] = [
  b(-3.5, 0, -2, 7, 6.5, 4, HOODIE),
  b(-3.7, 0, -2.2, 7.4, 0.7, 4.4, HOODIE_D),
  b(-2, 1, 2, 4, 1.7, 0.25, HOODIE_D),
  b(-3, 5.4, -3.1, 6, 1.7, 1.6, HOODIE_D),
  b(-1.1, 5.9, 1.7, 2.2, 0.6, 0.4, TEE),
  b(-0.9, 3.9, 2, 0.25, 2, 0.15, TEE),
  b(0.65, 3.9, 2, 0.25, 2, 0.15, TEE),
];

const HEAD: Box[] = [
  b(-3, 0, -3, 6, 6, 6, SKIN),
  b(-3.5, 2, -0.7, 0.5, 1.5, 1.2, SKIN_D),
  b(3, 2, -0.7, 0.5, 1.5, 1.2, SKIN_D),
  // closed, smiling eyes and brows
  b(-2.2, 3.3, 3, 1.5, 0.5, 0.12, FACE),
  b(0.7, 3.3, 3, 1.5, 0.5, 0.12, FACE),
  b(-2.5, 2.9, 3, 0.4, 0.55, 0.12, FACE),
  b(-0.8, 2.9, 3, 0.4, 0.55, 0.12, FACE),
  b(0.4, 2.9, 3, 0.4, 0.55, 0.12, FACE),
  b(2.1, 2.9, 3, 0.4, 0.55, 0.12, FACE),
  b(-2.3, 4.35, 3, 1.6, 0.35, 0.12, HAIR),
  b(0.7, 4.35, 3, 1.6, 0.35, 0.12, HAIR),
  b(-0.4, 2, 3, 0.8, 0.9, 0.35, SKIN_D),
  // smile
  b(-1.2, 1.1, 3, 2.4, 0.3, 0.12, FACE),
  b(-1.6, 1.35, 3, 0.4, 0.3, 0.12, FACE),
  b(1.2, 1.35, 3, 0.4, 0.3, 0.12, FACE),
  // hair: a cap, the back and sides, then uneven curls on top and a fringe
  b(-3.5, 5.4, -3.5, 7, 2, 7, HAIR),
  b(-3.5, 1.8, -3.7, 7, 4, 1.2, HAIR),
  b(-3.6, 3.8, -2.6, 0.7, 2, 4, HAIR),
  b(2.9, 3.8, -2.6, 0.7, 2, 4, HAIR),
  b(-3, 7.4, -1.6, 2.2, 1, 2.2, HAIR_L),
  b(0.3, 7.4, 0.2, 2.4, 1.2, 2.2, HAIR),
  b(-1.2, 7.4, -3.2, 2.2, 0.8, 2, HAIR),
  b(1.6, 7.3, -2.6, 1.8, 0.9, 1.8, HAIR_L),
  b(-2.4, 7.3, 1, 1.8, 0.8, 1.9, HAIR),
  b(-3.2, 4.8, 3, 1.7, 1.3, 0.6, HAIR),
  b(-1.1, 5.2, 3, 1.9, 0.9, 0.7, HAIR_L),
  b(1.2, 4.9, 3, 2, 1.2, 0.6, HAIR),
  b(-4.2, 5.2, -1.5, 1, 1.6, 2.4, HAIR_L),
  b(3.3, 5.4, -0.5, 1, 1.5, 2.2, HAIR),
  b(-0.6, 8.2, -1.2, 1.6, 0.8, 1.6, HAIR_L),
  b(1.4, 8.1, 0.8, 1.3, 0.7, 1.3, HAIR),
  b(-2.6, 8, -0.2, 1.3, 0.7, 1.4, HAIR),
  b(-1.8, 6.4, 3.2, 1.4, 1.1, 0.7, HAIR_L),
  b(0.6, 6.5, 3.3, 1.5, 1, 0.6, HAIR),
  b(-3.9, 6.6, 1, 0.9, 1.2, 1.6, HAIR),
  b(3.1, 6.8, -2.6, 0.9, 1.1, 1.8, HAIR_L),
  b(-0.8, 6.2, -4.2, 2.4, 1.6, 0.9, HAIR),
];

const anchor = new THREE.Vector3();

// How far each arm swings forward and inward to fold across the chest.
const CROSSED_X = -1.05;
const CROSSED_Z = 0.95;

const ARM: Box[] = [b(-1, -5.5, -1, 2, 6, 2, HOODIE), b(-1.1, -5.6, -1.1, 2.2, 0.8, 2.2, HOODIE_D), b(-0.8, -6.8, -0.8, 1.6, 1.2, 1.6, SKIN)];

/**
 * Aadit, in blocks. Bobs on the spot, looks around, and waves hello.
 * `greet` shows the speech bubble.
 */
export function Character({ position, greet }: { position: [number, number, number]; greet: boolean }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const waving = useRef<THREE.Group>(null);
  const resting = useRef<THREE.Group>(null);
  const animate = useMotion();

  useFrame(({ clock, camera, size }) => {
    // Tell the page where the speech bubble should sit: just above and beside the head.
    if (head.current) {
      head.current.getWorldPosition(anchor);
      anchor.y += 10.5 * U;
      anchor.project(camera);
      bubbleAnchor.x = (anchor.x * 0.5 + 0.5) * size.width;
      bubbleAnchor.y = (-anchor.y * 0.5 + 0.5) * size.height;
      bubbleAnchor.visible = greet && anchor.z < 1;
    }
    if (!animate) return;
    const t = clock.elapsedTime;
    if (root.current) {
      root.current.position.y = position[1] + 5.8 * U + Math.abs(Math.sin(t * 2)) * 0.06;
      root.current.rotation.y = Math.sin(t * 0.5) * 0.18;
    }
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 1.1) * 0.07;
      head.current.rotation.y = Math.sin(t * 0.7) * 0.2;
    }
    // Stand with arms crossed, as in the profile picture. Wave on arrival, then every so often.
    const cycle = t % 13;
    const up = cycle < 3 ? Math.min(1, cycle * 3) : Math.max(0, 1 - (cycle - 3) * 3);
    if (waving.current) {
      waving.current.rotation.x = CROSSED_X * (1 - up);
      waving.current.rotation.z = up * (2.55 + Math.sin(t * 9) * 0.32) - (1 - up) * CROSSED_Z;
    }
    if (resting.current) resting.current.rotation.x = CROSSED_X + Math.sin(t * 2) * 0.03;
  });

  return (
    <group ref={root} position={[position[0], position[1] + 5.8 * U, position[2]]} scale={U}>
      <Voxels boxes={LEGS} />
      <Voxels boxes={TORSO} />
      <group ref={head} position={[0, 6.6, 0]}>
        <Voxels boxes={HEAD} />
      </group>
      <group ref={waving} position={[4.4, 5.9, 0]} rotation={[CROSSED_X, 0, -CROSSED_Z]}>
        <Voxels boxes={ARM} />
      </group>
      <group ref={resting} position={[-4.4, 5.9, 0]} rotation={[CROSSED_X, 0, CROSSED_Z]}>
        <Voxels boxes={ARM} />
      </group>
    </group>
  );
}
