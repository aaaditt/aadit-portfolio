"use client";

import { C } from "../theme";
import { Ball, Bob, Box, Cyl, type Vec3 } from "./primitives";
import { Bush, Cloud, Flower, LampPost, PineTree, Pond, Rock, RoundTree, StonePath } from "./props";
import { AboutCorner, Arcade, CodeLab, DesignStudio, Hub } from "./zones";

function Island() {
  return (
    <group>
      <Cyl args={[10, 10, 0.5, 72]} color={C.grass} position={[0, -0.25, 0]} />
      <Cyl args={[10.12, 9.6, 0.5, 72]} color={C.grassDark} position={[0, -0.72, 0]} />
      <Cyl args={[9.5, 6.4, 2.2, 14]} color={C.earth} position={[0, -2.05, 0]} />
      <Cyl args={[6.3, 3.2, 2, 11]} color={C.earthDark} position={[0.3, -4.1, 0.2]} />
      <Cyl args={[3.1, 0.7, 1.9, 8]} color={C.earth} position={[0.5, -6, 0.3]} />
      <Box size={[1.6, 1.2, 1.4]} color={C.earthDark} position={[6.4, -2.6, 3.2]} rotation={[0.3, 0.6, 0.2]} radius={0.3} />
      <Box size={[1.3, 1, 1.2]} color={C.earth} position={[-6.8, -2.9, -2.4]} rotation={[0.2, 1.1, 0.4]} radius={0.26} />
      <Box size={[1, 0.8, 0.9]} color={C.earthDark} position={[-2.2, -5.3, 3]} rotation={[0.5, 0.2, 0.3]} radius={0.2} />
    </group>
  );
}

/** A small rock drifting beside the island, with a tree on it. */
function Islet({ position, phase }: { position: Vec3; phase: number }) {
  return (
    <Bob position={position} amp={0.3} speed={0.45} phase={phase}>
      <Cyl args={[1.3, 1.3, 0.3, 20]} color={C.grass} position={[0, 0, 0]} />
      <Cyl args={[1.25, 0.25, 1.5, 8]} color={C.earth} position={[0, -0.9, 0]} />
      <PineTree position={[0.2, 0.15, 0]} scale={0.8} />
      <Bush position={[-0.6, 0.15, 0.3]} scale={0.7} />
    </Bob>
  );
}

const TREES: { at: Vec3; scale: number; pine?: boolean }[] = [
  { at: [-9, 0, -0.4], scale: 1.05 },
  { at: [-7.2, 0, 4.8], scale: 0.9, pine: true },
  { at: [-8.4, 0, -3.6], scale: 1, pine: true },
  { at: [-6.6, 0, -5.6], scale: 1.2 },
  { at: [-3.6, 0, -7.9], scale: 0.95, pine: true },
  { at: [3.8, 0, -7.8], scale: 1.05, pine: true },
  { at: [6.6, 0, -5.6], scale: 1.1 },
  { at: [8.5, 0, -3.2], scale: 0.9, pine: true },
  { at: [9, 0, -0.6], scale: 1.1 },
  { at: [5.2, 0, 7], scale: 0.85 },
  { at: [-5, 0, 7.2], scale: 1 },
];

const BUSHES: Vec3[] = [
  [-3, 0, 3.4],
  [3.2, 0, 2.9],
  [-7.6, 0, 0.4],
  [7.8, 0, 0.2],
  [-2.2, 0, -3.4],
  [2.4, 0, -3.2],
  [6.4, 0, 5.2],
  [-6.2, 0, 5.9],
  [1.6, 0, 8.6],
];

const ROCKS: { at: Vec3; scale: number }[] = [
  { at: [-4.4, 0, 3.3], scale: 0.9 },
  { at: [8.7, 0, 2], scale: 1.1 },
  { at: [-8.6, 0, 2.2], scale: 0.8 },
  { at: [2.9, 0, 6.2], scale: 0.7 },
  { at: [-1.6, 0, -8.6], scale: 1 },
];

const PETALS = [C.coral, C.yellow, C.pink, C.orange, C.cream];

// Scattered flowers, placed by a fixed pattern so they are the same on every visit.
const FLOWERS: Vec3[] = Array.from({ length: 34 }, (_, i) => {
  const angle = i * 2.399963;
  const radius = 5.2 + ((i * 53) % 40) / 10;
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as Vec3;
}).filter(([x, , z]) => {
  const nearDesign = Math.hypot(x + 5.4, z + 1.4) < 3.1;
  const nearCode = Math.hypot(x - 5.4, z + 1.4) < 3.1;
  const nearArcade = Math.hypot(x, z + 6) < 3.8;
  const nearAbout = Math.hypot(x, z - 6) < 2.6;
  const nearPond = Math.hypot(x - 5.6, z - 3.9) < 1.7;
  return !(nearDesign || nearCode || nearArcade || nearAbout || nearPond);
});

export function Scene() {
  return (
    <>
      <color attach="background" args={[C.sky]} />
      <fog attach="fog" args={[C.sky, 50, 130]} />

      <hemisphereLight args={[C.cream, C.grass, 0.85]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[9, 14, 8]}
        intensity={2.3}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-camera-far={45}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      <Bob amp={0.18} speed={0.5}>
        <Island />
        <Hub />
        <DesignStudio position={[-5.4, 0, -1.4]} rotation={[0, 0.45, 0]} />
        <CodeLab position={[5.4, 0, -1.4]} rotation={[0, -0.45, 0]} />
        <Arcade position={[0, 0, -6]} />
        <AboutCorner position={[0, 0, 6]} />

        <StonePath from={[-1.8, 1.6]} to={[-4.4, 0.6]} />
        <StonePath from={[1.8, 1.6]} to={[4.4, 0.6]} />
        <StonePath from={[0, -0.6]} to={[0, -3.9]} />
        <StonePath from={[0, 1.6]} to={[0, 4.9]} />

        <Pond position={[5.6, 0, 3.9]} />
        <LampPost position={[3.4, 0, -3.6]} />

        {TREES.map((t, i) =>
          t.pine ? (
            <PineTree key={i} position={t.at} scale={t.scale} />
          ) : (
            <RoundTree key={i} position={t.at} scale={t.scale} phase={i} />
          ),
        )}
        {BUSHES.map((at, i) => (
          <Bush key={i} position={at} scale={0.8 + (i % 3) * 0.15} />
        ))}
        {ROCKS.map((r, i) => (
          <Rock key={i} position={r.at} scale={r.scale} />
        ))}
        {FLOWERS.map((at, i) => (
          <Flower key={i} position={at} color={PETALS[i % PETALS.length]} />
        ))}
      </Bob>

      <Islet position={[-14, -1.5, -6]} phase={1} />
      <Islet position={[15, 0.5, -9]} phase={3} />

      <Cloud position={[-9, 8.5, -8]} scale={1.5} phase={0} />
      <Cloud position={[8, 10, -12]} scale={1.9} phase={2} />
      <Cloud position={[13, 6.5, 2]} scale={1.1} phase={4} />
      <Cloud position={[-14, 5.5, 3]} scale={1.2} phase={5} />

      {/* a far-off sun */}
      <Ball r={2.2} color={C.yellow} glow={0.9} position={[-22, 16, -34]} />
    </>
  );
}
