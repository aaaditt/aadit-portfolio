"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type * as THREE from "three";

export type Vec3 = [number, number, number];

type Placement = { position?: Vec3; rotation?: Vec3; scale?: number | Vec3 };

/** False when the visitor has asked for reduced motion. */
export const MotionContext = createContext(true);
export const useMotion = () => useContext(MotionContext);

function Soft({ color, glow = 0 }: { color: string; glow?: number }) {
  return <meshStandardMaterial color={color} roughness={0.9} emissive={color} emissiveIntensity={glow} />;
}

/** A box with softened corners. */
export function Box({
  size,
  color,
  radius,
  glow,
  ...place
}: Placement & { size: Vec3; color: string; radius?: number; glow?: number }) {
  return (
    <RoundedBox
      args={size}
      radius={radius ?? Math.min(...size) * 0.18}
      smoothness={3}
      castShadow
      receiveShadow
      {...place}
    >
      <Soft color={color} glow={glow} />
    </RoundedBox>
  );
}

/** A cylinder: [top radius, bottom radius, height, sides]. */
export function Cyl({
  args,
  color,
  glow,
  ...place
}: Placement & { args: [number, number, number, number?]; color: string; glow?: number }) {
  const [top, bottom, height, sides = 20] = args;
  return (
    <mesh castShadow receiveShadow {...place}>
      <cylinderGeometry args={[top, bottom, height, sides]} />
      <Soft color={color} glow={glow} />
    </mesh>
  );
}

export function Ball({ r, color, glow, ...place }: Placement & { r: number; color: string; glow?: number }) {
  return (
    <mesh castShadow receiveShadow {...place}>
      <sphereGeometry args={[r, 24, 18]} />
      <Soft color={color} glow={glow} />
    </mesh>
  );
}

/** A cone: [radius, height, sides]. */
export function Cone({
  args,
  color,
  ...place
}: Placement & { args: [number, number, number?]; color: string }) {
  const [radius, height, sides = 24] = args;
  return (
    <mesh castShadow receiveShadow {...place}>
      <coneGeometry args={[radius, height, sides]} />
      <Soft color={color} />
    </mesh>
  );
}

/** Gently bobs and sways its children. Still when motion is reduced. */
export function Bob({
  children,
  position = [0, 0, 0],
  amp = 0.15,
  speed = 1,
  phase = 0,
  sway = 0,
}: {
  children: ReactNode;
  position?: Vec3;
  amp?: number;
  speed?: number;
  phase?: number;
  sway?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const animate = useMotion();

  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group || !animate) return;
    const t = clock.elapsedTime * speed + phase;
    group.position.y = position[1] + Math.sin(t) * amp;
    group.rotation.z = Math.sin(t * 0.7) * sway;
  });

  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}
