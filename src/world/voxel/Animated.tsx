"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { useMotion } from "../motion";
import { b } from "./box";
import * as M from "./models";
import { HALF, plateau, riverZ } from "./terrain";
import { Voxels } from "./Voxels";

export const WATER_LEVEL = 0.72;

export function Water() {
  const ref = useRef<THREE.Mesh>(null);
  const animate = useMotion();

  useFrame(({ clock }) => {
    if (ref.current && animate) ref.current.position.y = WATER_LEVEL + Math.sin(clock.elapsedTime * 0.9) * 0.05;
  });

  return (
    <mesh ref={ref} position={[0, WATER_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      {/* Far wider than the land, so the lake runs out to the horizon. */}
      <planeGeometry args={[HALF * 12, HALF * 12]} />
      <meshStandardMaterial color="#4fb3d9" roughness={0.35} transparent opacity={0.84} />
    </mesh>
  );
}

function Drifter({ start, span, speed, bob, children }: { start: [number, number, number]; span: number; speed: number; bob: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const animate = useMotion();

  useFrame(({ clock }) => {
    if (!ref.current || !animate) return;
    const t = clock.elapsedTime;
    ref.current.position.x = start[0] + Math.sin(t * speed + start[2]) * span;
    ref.current.position.y = start[1] + Math.sin(t * 0.6 + start[0]) * bob;
  });

  return (
    <group ref={ref} position={start}>
      {children}
    </group>
  );
}

const CLOUDS: [number, number, number][] = [
  [-26, 27, -30],
  [18, 31, -40],
  [34, 24, -6],
  [-36, 22, 6],
  [4, 34, -14],
  [-12, 26, 26],
];

export function Clouds() {
  const models = useMemo(() => CLOUDS.map((_, i) => M.cloud(i)), []);
  const ref = useRef<THREE.Group>(null);

  // Seen from high above in the opening map view, clouds are just white slabs in the way.
  useFrame(({ camera }) => {
    if (ref.current) ref.current.visible = camera.position.y < 60;
  });

  return (
    <group ref={ref}>
      {CLOUDS.map((at, i) => (
        <Drifter key={i} start={at} span={7} speed={0.05 + (i % 3) * 0.02} bob={0.4}>
          <Voxels boxes={models[i]} shadows={false} />
        </Drifter>
      ))}
    </group>
  );
}

export function HotAirBalloon() {
  const model = useMemo(() => M.balloon(), []);
  return (
    <Drifter start={[24, 22, -20]} span={6} speed={0.07} bob={1.2}>
      <Voxels boxes={model} />
    </Drifter>
  );
}

export function WindmillSails() {
  const ref = useRef<THREE.Group>(null);
  const animate = useMotion();
  const model = useMemo(() => M.windmillSails(), []);
  const mill = plateau("windmill");

  useFrame((_, delta) => {
    if (ref.current && animate) ref.current.rotation.z -= delta * 0.5;
  });

  return (
    <group ref={ref} position={[mill.x, mill.h + 7, mill.z + 1.9]} rotation={[0, 0, 0.4]}>
      <Voxels boxes={model} />
    </group>
  );
}

export function Boat() {
  const ref = useRef<THREE.Group>(null);
  const animate = useMotion();
  const model = useMemo(() => M.boat(), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = animate ? clock.elapsedTime : 0;
    // Sail between x = -30 and x = -5, turning round at each end.
    const lap = (t * 0.035) % 1;
    const u = 1 - Math.abs(lap * 2 - 1);
    const x = -30 + u * 25;
    const heading = lap < 0.5 ? 1 : -1;
    ref.current.position.set(x, WATER_LEVEL - 0.15 + Math.sin(t * 1.3) * 0.07, riverZ(x));
    ref.current.rotation.set(0, Math.atan2(-(riverZ(x + heading) - riverZ(x)), heading) + (heading < 0 ? Math.PI : 0), Math.sin(t * 1.1) * 0.05);
  });

  return (
    <group ref={ref} position={[-30, WATER_LEVEL - 0.15, riverZ(-30)]}>
      <Voxels boxes={model} />
    </group>
  );
}

const FLAMES = [b(-0.3, 0, -0.3, 0.6, 0.7, 0.6, "#ff8a3c"), b(-0.18, 0.5, -0.18, 0.36, 0.6, 0.36, "#ffc857"), b(-0.08, 1, -0.08, 0.16, 0.35, 0.16, "#fff1a8")];

export function Campfire() {
  const ref = useRef<THREE.Group>(null);
  const animate = useMotion();
  const lookout = plateau("lookout");

  useFrame(({ clock }) => {
    if (!ref.current || !animate) return;
    const t = clock.elapsedTime;
    ref.current.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9) * 0.18, 1 + Math.cos(t * 11) * 0.08);
  });

  return (
    <group position={[lookout.x - 0.02, lookout.h + 0.3, lookout.z + 1.5]}>
      <group ref={ref}>
        <Voxels boxes={FLAMES} glow />
      </group>
      <pointLight color="#ffb347" intensity={6} distance={9} position={[0, 1, 0]} />
    </group>
  );
}
