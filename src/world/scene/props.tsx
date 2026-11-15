"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { C } from "../theme";
import { Ball, Bob, Box, Cone, Cyl, useMotion, type Vec3 } from "./primitives";

export function RoundTree({ position, scale = 1, phase = 0 }: { position: Vec3; scale?: number; phase?: number }) {
  return (
    <group position={position} scale={scale}>
      <Cyl args={[0.13, 0.18, 1.1, 10]} color={C.wood} position={[0, 0.55, 0]} />
      <Bob position={[0, 0, 0]} amp={0} sway={0.025} speed={0.9} phase={phase}>
        <Ball r={0.8} color={C.teal} position={[0, 1.6, 0]} />
        <Ball r={0.55} color={C.tealDark} position={[0.45, 1.25, 0.2]} />
        <Ball r={0.5} color={C.teal} position={[-0.45, 1.3, -0.15]} />
      </Bob>
    </group>
  );
}

export function PineTree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Cyl args={[0.1, 0.14, 0.7, 8]} color={C.wood} position={[0, 0.35, 0]} />
      <Cone args={[0.75, 1.1, 10]} color={C.tealDark} position={[0, 1.1, 0]} />
      <Cone args={[0.58, 0.95, 10]} color={C.teal} position={[0, 1.7, 0]} />
      <Cone args={[0.4, 0.8, 10]} color={C.tealDark} position={[0, 2.25, 0]} />
    </group>
  );
}

export function Bush({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Ball r={0.38} color={C.grassDark} position={[0, 0.25, 0]} />
      <Ball r={0.28} color={C.teal} position={[0.32, 0.2, 0.08]} />
      <Ball r={0.26} color={C.grassDark} position={[-0.3, 0.18, -0.05]} />
    </group>
  );
}

export function Rock({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Box size={[0.6, 0.4, 0.5]} color={C.stone} position={[0, 0.18, 0]} rotation={[0, 0.5, 0.1]} radius={0.14} />
      <Box size={[0.32, 0.25, 0.3]} color={C.stone} position={[0.36, 0.1, 0.18]} rotation={[0.1, 1, 0]} radius={0.09} />
    </group>
  );
}

export function Flower({ position, color }: { position: Vec3; color: string }) {
  return (
    <group position={position}>
      <Cyl args={[0.018, 0.018, 0.26, 5]} color={C.tealDark} position={[0, 0.13, 0]} />
      <Ball r={0.085} color={color} position={[0, 0.29, 0]} />
      <Ball r={0.04} color={C.yellow} position={[0, 0.34, 0]} />
    </group>
  );
}

export function Cloud({ position, scale = 1, phase = 0 }: { position: Vec3; scale?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null);
  const animate = useMotion();

  useFrame(({ clock }) => {
    if (!ref.current || !animate) return;
    ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * 0.08 + phase) * 2.5;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <Bob amp={0.2} speed={0.5} phase={phase}>
        <Ball r={0.7} color={C.white} position={[0, 0, 0]} />
        <Ball r={0.5} color={C.white} position={[0.75, -0.12, 0.1]} />
        <Ball r={0.55} color={C.white} position={[-0.7, -0.1, -0.05]} />
        <Ball r={0.4} color={C.white} position={[0.25, 0.35, -0.1]} />
      </Bob>
    </group>
  );
}

export function LampPost({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <Cyl args={[0.1, 0.14, 0.16, 10]} color={C.navy} position={[0, 0.08, 0]} />
      <Cyl args={[0.045, 0.045, 1.7, 8]} color={C.navy} position={[0, 0.95, 0]} />
      <Ball r={0.2} color={C.yellow} glow={0.9} position={[0, 1.92, 0]} />
      <Cone args={[0.26, 0.16, 10]} color={C.navy} position={[0, 2.12, 0]} />
    </group>
  );
}

export function Bench({ position, rotation }: { position: Vec3; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[1.2, 0.08, 0.4]} color={C.wood} position={[0, 0.36, 0]} />
      <Box size={[1.2, 0.36, 0.07]} color={C.wood} position={[0, 0.62, -0.19]} rotation={[-0.15, 0, 0]} />
      <Box size={[0.08, 0.36, 0.36]} color={C.navy} position={[-0.48, 0.18, 0]} />
      <Box size={[0.08, 0.36, 0.36]} color={C.navy} position={[0.48, 0.18, 0]} />
    </group>
  );
}

/** A trail of stepping stones from one point on the ground to another. */
export function StonePath({ from, to }: { from: [number, number]; to: [number, number] }) {
  const stones = useMemo(() => {
    const [x1, z1] = from;
    const [x2, z2] = to;
    const length = Math.hypot(x2 - x1, z2 - z1);
    const count = Math.max(2, Math.round(length / 0.62));
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 0.5) / count;
      const wobble = (i % 2 === 0 ? 1 : -1) * 0.09;
      const nx = -(z2 - z1) / length;
      const nz = (x2 - x1) / length;
      return {
        position: [x1 + (x2 - x1) * t + nx * wobble, 0.02, z1 + (z2 - z1) * t + nz * wobble] as Vec3,
        size: 0.2 + ((i * 7) % 3) * 0.025,
        turn: i * 1.3,
      };
    });
  }, [from, to]);

  return (
    <group>
      {stones.map((s, i) => (
        <mesh key={i} position={s.position} rotation={[0, s.turn, 0]} receiveShadow>
          <cylinderGeometry args={[s.size, s.size * 1.08, 0.05, 7]} />
          <meshStandardMaterial color={C.stone} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export function Pond({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]} scale={[1.25, 1, 1]} receiveShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.03, 40]} />
        <meshStandardMaterial color={C.stone} roughness={1} />
      </mesh>
      <mesh position={[0, 0.035, 0]} scale={[1.25, 1, 1]}>
        <cylinderGeometry args={[0.9, 0.9, 0.03, 40]} />
        <meshStandardMaterial color={C.water} roughness={0.25} />
      </mesh>
      <Cyl args={[0.16, 0.16, 0.02, 12]} color={C.grassDark} position={[0.35, 0.06, 0.2]} />
      <Cyl args={[0.12, 0.12, 0.02, 12]} color={C.grassDark} position={[-0.45, 0.06, -0.15]} />
      <Ball r={0.05} color={C.pink} position={[0.35, 0.1, 0.2]} />
      <Rock position={[-1.1, 0, 0.55]} scale={0.7} />
    </group>
  );
}

/** Puffs rising from a chimney, looping. */
export function Smoke({ position }: { position: Vec3 }) {
  const ref = useRef<THREE.Group>(null);
  const animate = useMotion();

  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group || !animate) return;
    group.children.forEach((puff, i) => {
      const t = (clock.elapsedTime * 0.25 + i / 3) % 1;
      puff.position.set(Math.sin(t * 4 + i) * 0.12, t * 1.4, 0);
      puff.scale.setScalar(0.5 + t * 0.8 - Math.max(0, t - 0.7) * 3.5);
    });
  });

  return (
    <group ref={ref} position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 0.45, 0]} scale={0.6 + i * 0.2}>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshStandardMaterial color={C.white} roughness={1} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}
