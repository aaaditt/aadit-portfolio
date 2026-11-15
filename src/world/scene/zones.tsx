"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { C } from "../theme";
import { Ball, Bob, Box, Cone, Cyl, useMotion, type Vec3 } from "./primitives";
import { Bench, Flower, LampPost, Smoke } from "./props";

type ZoneProps = { position: Vec3; rotation?: Vec3 };

const GLYPHS: Record<string, string[]> = {
  A: [".##.", "#..#", "####", "#..#", "#..#"],
  D: ["###.", "#..#", "#..#", "#..#", "###."],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
};

/** The name, built from small blocks so it needs no font file. */
function NameSign({ text, position }: { text: string; position: Vec3 }) {
  const cell = 0.3;
  const blocks = useMemo(() => {
    const out: { at: Vec3; letter: number }[] = [];
    let x = 0;
    [...text].forEach((ch, letter) => {
      const glyph = GLYPHS[ch];
      if (!glyph) return;
      glyph.forEach((row, r) => {
        [...row].forEach((c, col) => {
          if (c === "#") out.push({ at: [(x + col) * cell, (4 - r) * cell, 0], letter });
        });
      });
      x += glyph[0].length + 1;
    });
    const width = (x - 1) * cell;
    return out.map((b) => ({ ...b, at: [b.at[0] - width / 2 + cell / 2, b.at[1] + cell / 2, 0] as Vec3 }));
  }, [text]);

  const colours = [C.coral, C.orange, C.teal, C.navy, C.coral];

  return (
    <group position={position}>
      <Box size={[6.4, 0.22, 0.9]} color={C.cream} position={[0, 0.11, 0]} radius={0.08} />
      <group position={[0, 0.22, 0]}>
        {blocks.map((b, i) => (
          <Box key={i} size={[cell * 0.94, cell * 0.94, cell * 1.3]} color={colours[b.letter % colours.length]} position={b.at} radius={0.05} />
        ))}
      </group>
    </group>
  );
}

function Character({ position }: { position: Vec3 }) {
  const ref = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const animate = useMotion();

  useFrame(({ clock }) => {
    if (!ref.current || !animate) return;
    const t = clock.elapsedTime;
    ref.current.position.y = position[1] + Math.abs(Math.sin(t * 2.2)) * 0.1;
    ref.current.rotation.y = Math.sin(t * 0.6) * 0.3;
    if (arm.current) arm.current.rotation.z = -2.4 + Math.sin(t * 5) * 0.35;
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.36, 8, 16]} />
        <meshStandardMaterial color={C.navy} roughness={0.9} />
      </mesh>
      <Ball r={0.27} color={C.pink} position={[0, 1.18, 0]} />
      <Ball r={0.035} color={C.ink} position={[-0.09, 1.22, 0.24]} />
      <Ball r={0.035} color={C.ink} position={[0.09, 1.22, 0.24]} />
      <Cyl args={[0.29, 0.3, 0.12, 20]} color={C.coral} position={[0, 1.4, 0]} />
      <Box size={[0.3, 0.05, 0.22]} color={C.coral} position={[0, 1.36, 0.28]} radius={0.02} />
      <group ref={arm} position={[0.27, 0.78, 0]} rotation={[0, 0, -2.4]}>
        <Cyl args={[0.06, 0.06, 0.42, 8]} color={C.navy} position={[0, -0.2, 0]} />
        <Ball r={0.075} color={C.pink} position={[0, -0.43, 0]} />
      </group>
      <Cyl args={[0.06, 0.06, 0.4, 8]} color={C.navy} position={[-0.3, 0.62, 0]} rotation={[0, 0, -0.25]} />
    </group>
  );
}

/** The middle of the island: the name, the character, and a ring of flowers. */
export function Hub() {
  const petals = [C.coral, C.yellow, C.pink, C.orange, C.cream];
  return (
    <group>
      <NameSign text="AADIT" position={[0, 0, 0.4]} />
      <Character position={[3.9, 0, 1.3]} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI - Math.PI;
        return <Flower key={i} position={[Math.cos(a) * 3.5, 0, 0.4 + Math.sin(a) * 1.1]} color={petals[i % petals.length]} />;
      })}
    </group>
  );
}

export function DesignStudio({ position, rotation }: ZoneProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* building */}
      <Box size={[2.9, 2, 2.4]} color={C.cream} position={[0, 1, 0]} radius={0.16} />
      <Box size={[3.3, 0.18, 2.8]} color={C.coral} position={[0, 2.08, 0]} radius={0.07} />
      <Cone args={[2.25, 1.15, 4]} color={C.coral} position={[0, 2.72, 0]} rotation={[0, Math.PI / 4, 0]} />
      <Box size={[0.42, 0.9, 0.42]} color={C.stone} position={[0.8, 2.9, -0.4]} radius={0.06} />
      <Smoke position={[0.8, 3.5, -0.4]} />
      {/* big studio window, door, awning */}
      <Box size={[1.25, 1.05, 0.08]} color={C.water} position={[-0.6, 1.15, 1.2]} radius={0.04} />
      <Box size={[1.4, 0.07, 0.12]} color={C.navy} position={[-0.6, 0.6, 1.22]} radius={0.03} />
      <Box size={[0.06, 1.05, 0.1]} color={C.navy} position={[-0.6, 1.15, 1.22]} radius={0.02} />
      <Box size={[0.62, 1.2, 0.08]} color={C.teal} position={[0.85, 0.6, 1.2]} radius={0.05} />
      <Ball r={0.045} color={C.yellow} position={[1.05, 0.6, 1.26]} />
      <Box size={[0.95, 0.08, 0.5]} color={C.orange} position={[0.85, 1.4, 1.42]} rotation={[0.35, 0, 0]} radius={0.03} />
      {/* easel with a canvas */}
      <group position={[-1.2, 0, 2.4]} rotation={[0, 0.5, 0]}>
        <Cyl args={[0.03, 0.03, 1.5, 6]} color={C.wood} position={[-0.3, 0.72, 0]} rotation={[0, 0, -0.16]} />
        <Cyl args={[0.03, 0.03, 1.5, 6]} color={C.wood} position={[0.3, 0.72, 0]} rotation={[0, 0, 0.16]} />
        <Cyl args={[0.03, 0.03, 1.5, 6]} color={C.wood} position={[0, 0.72, -0.3]} rotation={[0.3, 0, 0]} />
        <Box size={[0.9, 0.7, 0.05]} color={C.white} position={[0, 0.98, 0.06]} rotation={[-0.12, 0, 0]} radius={0.02} />
        <Ball r={0.13} color={C.coral} position={[-0.2, 1.05, 0.1]} scale={[1, 1, 0.3]} />
        <Ball r={0.16} color={C.teal} position={[0.14, 0.92, 0.1]} scale={[1, 1, 0.3]} />
        <Ball r={0.09} color={C.yellow} position={[0.22, 1.16, 0.1]} scale={[1, 1, 0.3]} />
      </group>
      {/* paint pots */}
      {[C.coral, C.teal, C.yellow].map((colour, i) => (
        <group key={colour} position={[0.1 + i * 0.42, 0, 2.3 + (i % 2) * 0.2]}>
          <Cyl args={[0.15, 0.13, 0.26, 14]} color={C.stone} position={[0, 0.13, 0]} />
          <Cyl args={[0.13, 0.13, 0.03, 14]} color={colour} position={[0, 0.27, 0]} />
        </group>
      ))}
      {/* giant pencil leaning on the wall */}
      <group position={[1.85, 0, 0.7]} rotation={[0, 0, -0.22]}>
        <Cone args={[0.16, 0.36, 6]} color={C.pink} position={[0, 0.18, 0]} rotation={[Math.PI, 0, 0]} />
        <Cyl args={[0.16, 0.16, 1.9, 6]} color={C.yellow} position={[0, 1.31, 0]} />
        <Cyl args={[0.17, 0.17, 0.14, 6]} color={C.stone} position={[0, 2.33, 0]} />
        <Cyl args={[0.16, 0.16, 0.22, 6]} color={C.coral} position={[0, 2.51, 0]} />
      </group>
    </group>
  );
}

function ScreenLines({ rows, width }: { rows: number; width: number }) {
  const colours = [C.yellow, C.water, C.pink, C.grass];
  return (
    <group>
      {Array.from({ length: rows }, (_, i) => {
        const w = width * (0.35 + ((i * 37) % 50) / 100);
        const indent = (i % 3) * 0.1;
        return (
          <Box
            key={i}
            size={[w, 0.06, 0.02]}
            color={colours[i % colours.length]}
            glow={0.6}
            position={[-width / 2 + w / 2 + indent, (rows / 2 - i) * 0.14 - 0.07, 0]}
            radius={0.008}
          />
        );
      })}
    </group>
  );
}

export function CodeLab({ position, rotation }: ZoneProps) {
  const dish = useRef<THREE.Group>(null);
  const animate = useMotion();

  useFrame(({ clock }) => {
    if (dish.current && animate) dish.current.rotation.y = clock.elapsedTime * 0.5;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* building: two stacked blocks */}
      <Box size={[3, 1.7, 2.4]} color={C.navy} position={[0, 0.85, 0]} radius={0.14} />
      <Box size={[1.9, 1.1, 1.9]} color={C.teal} position={[-0.45, 2.25, 0]} radius={0.12} />
      <Box size={[3.2, 0.14, 2.6]} color={C.cream} position={[0, 1.72, 0]} radius={0.05} />
      {/* big screen of code on the front */}
      <Box size={[1.7, 1.1, 0.08]} color={C.ink} position={[-0.45, 0.95, 1.21]} radius={0.05} />
      <group position={[-0.45, 0.95, 1.27]}>
        <ScreenLines rows={6} width={1.3} />
      </group>
      <Box size={[0.6, 1.15, 0.08]} color={C.orange} position={[1, 0.58, 1.21]} radius={0.05} />
      <Box size={[0.9, 0.5, 0.06]} color={C.water} position={[-0.45, 2.3, 0.96]} radius={0.04} />
      {/* satellite dish */}
      <group position={[0.95, 1.8, -0.3]}>
        <Cyl args={[0.05, 0.05, 0.7, 8]} color={C.stone} position={[0, 0.35, 0]} />
        <group ref={dish} position={[0, 0.75, 0]}>
          <Cone args={[0.42, 0.22, 20]} color={C.cream} rotation={[-1.1, 0, 0]} />
          <Ball r={0.06} color={C.coral} glow={0.8} position={[0, 0.16, 0.3]} />
        </group>
      </group>
      {/* server rack */}
      <group position={[1.95, 0, 1.5]} rotation={[0, -0.35, 0]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0.24 + i * 0.46, 0]}>
            <Box size={[0.8, 0.4, 0.7]} color={C.stone} radius={0.05} />
            <Ball r={0.035} color={C.teal} glow={1} position={[-0.25, 0.05, 0.36]} />
            <Ball r={0.035} color={i === 1 ? C.coral : C.yellow} glow={1} position={[-0.13, 0.05, 0.36]} />
            <Box size={[0.3, 0.04, 0.02]} color={C.navy} position={[0.18, 0.05, 0.36]} radius={0.008} />
          </group>
        ))}
      </group>
      {/* laptop on a crate */}
      <group position={[-1.55, 0, 2.1]} rotation={[0, 0.4, 0]}>
        <Box size={[0.75, 0.5, 0.6]} color={C.wood} position={[0, 0.25, 0]} radius={0.05} />
        <Box size={[0.5, 0.03, 0.34]} color={C.stone} position={[0, 0.52, 0.04]} radius={0.01} />
        <Box size={[0.5, 0.34, 0.03]} color={C.ink} position={[0, 0.68, -0.14]} rotation={[-0.25, 0, 0]} radius={0.01} />
      </group>
    </group>
  );
}

function Cabinet({ position, rotation, colour }: { position: Vec3; rotation?: Vec3; colour: string }) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.8, 1.7, 0.75]} color={colour} position={[0, 0.85, 0]} radius={0.07} />
      <Box size={[0.84, 0.3, 0.2]} color={C.yellow} glow={0.35} position={[0, 1.6, 0.34]} radius={0.04} />
      <Box size={[0.62, 0.5, 0.05]} color={C.ink} position={[0, 1.15, 0.38]} rotation={[-0.2, 0, 0]} radius={0.03} />
      <Box size={[0.2, 0.16, 0.02]} color={C.water} glow={0.8} position={[-0.1, 1.17, 0.415]} rotation={[-0.2, 0, 0]} radius={0.01} />
      <Box size={[0.1, 0.1, 0.02]} color={C.coral} glow={0.8} position={[0.15, 1.07, 0.435]} rotation={[-0.2, 0, 0]} radius={0.01} />
      <Box size={[0.8, 0.1, 0.36]} color={C.cream} position={[0, 0.82, 0.5]} radius={0.03} />
      <Cyl args={[0.018, 0.018, 0.14, 6]} color={C.ink} position={[-0.18, 0.93, 0.5]} />
      <Ball r={0.05} color={C.coral} position={[-0.18, 1.01, 0.5]} />
      <Ball r={0.04} color={C.teal} position={[0.1, 0.89, 0.52]} />
      <Ball r={0.04} color={C.yellow} position={[0.23, 0.89, 0.46]} />
    </group>
  );
}

function Bunting({ from, to }: { from: Vec3; to: Vec3 }) {
  const colours = [C.coral, C.yellow, C.teal, C.orange, C.pink];
  const count = 9;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 0.5) / count;
        const sag = Math.sin(t * Math.PI) * 0.45;
        return (
          <Cone
            key={i}
            args={[0.12, 0.26, 3]}
            color={colours[i % colours.length]}
            position={[from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sag, from[2] + (to[2] - from[2]) * t]}
            rotation={[Math.PI, 0, 0]}
          />
        );
      })}
    </group>
  );
}

function Balloon({ position, colour, phase }: { position: Vec3; colour: string; phase: number }) {
  return (
    <group position={position}>
      <Cyl args={[0.008, 0.008, 1.5, 4]} color={C.ink} position={[0, 0.75, 0]} />
      <Bob position={[0, 1.6, 0]} amp={0.07} speed={1.4} phase={phase} sway={0.08}>
        <Ball r={0.26} color={colour} scale={[1, 1.2, 1]} />
      </Bob>
    </group>
  );
}

export function Arcade({ position, rotation }: ZoneProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* event tent */}
      <group position={[0, 0, -0.5]}>
        <Cyl args={[1.5, 1.5, 1.15, 12]} color={C.cream} position={[0, 0.58, 0]} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <Box key={i} size={[0.42, 1.12, 0.06]} color={C.coral} position={[Math.sin(a) * 1.49, 0.58, Math.cos(a) * 1.49]} rotation={[0, a, 0]} radius={0.02} />;
        })}
        <Cone args={[1.85, 1.3, 12]} color={C.orange} position={[0, 1.8, 0]} />
        <Cyl args={[0.02, 0.02, 0.5, 5]} color={C.ink} position={[0, 2.65, 0]} />
        <Box size={[0.36, 0.22, 0.02]} color={C.teal} position={[0.19, 2.78, 0]} radius={0.008} />
        <Box size={[0.6, 0.95, 0.06]} color={C.navy} position={[0, 0.48, 1.49]} radius={0.04} />
      </group>
      {/* arcade cabinets */}
      <Cabinet position={[-2.1, 0, 0.5]} rotation={[0, 0.5, 0]} colour={C.coral} />
      <Cabinet position={[2.1, 0, 0.5]} rotation={[0, -0.5, 0]} colour={C.teal} />
      {/* bunting between two poles */}
      <Cyl args={[0.04, 0.04, 2.5, 6]} color={C.wood} position={[-3, 1.25, 1.2]} />
      <Cyl args={[0.04, 0.04, 2.5, 6]} color={C.wood} position={[3, 1.25, 1.2]} />
      <Bunting from={[-3, 2.45, 1.2]} to={[3, 2.45, 1.2]} />
      {/* balloons, and a dice to sit on */}
      <Balloon position={[-1.15, 0, 1.3]} colour={C.coral} phase={0} />
      <Balloon position={[-0.9, 0, 1.55]} colour={C.yellow} phase={1.5} />
      <Balloon position={[1.1, 0, 1.4]} colour={C.teal} phase={3} />
      <group position={[0.3, 0, 1.9]} rotation={[0, 0.5, 0]}>
        <Box size={[0.5, 0.5, 0.5]} color={C.white} position={[0, 0.25, 0]} radius={0.09} />
        <Ball r={0.05} color={C.ink} position={[0, 0.25, 0.25]} />
        <Ball r={0.05} color={C.ink} position={[0.12, 0.5, 0.12]} />
        <Ball r={0.05} color={C.ink} position={[-0.12, 0.5, -0.12]} />
      </group>
    </group>
  );
}

export function AboutCorner({ position, rotation }: ZoneProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* mailbox */}
      <group position={[-1.1, 0, 0]}>
        <Cyl args={[0.06, 0.06, 0.9, 8]} color={C.wood} position={[0, 0.45, 0]} />
        <Box size={[0.42, 0.34, 0.62]} color={C.coral} position={[0, 1.02, 0]} radius={0.12} />
        <Box size={[0.3, 0.2, 0.02]} color={C.cream} position={[0, 1.02, 0.315]} radius={0.01} />
        <Box size={[0.03, 0.26, 0.14]} color={C.yellow} position={[0.23, 1.15, 0.1]} radius={0.01} />
      </group>
      {/* signpost */}
      <group position={[1.3, 0, -0.2]}>
        <Cyl args={[0.05, 0.05, 1.7, 8]} color={C.wood} position={[0, 0.85, 0]} />
        <Box size={[0.8, 0.2, 0.06]} color={C.teal} position={[0.28, 1.5, 0]} rotation={[0, 0.3, 0]} radius={0.03} />
        <Box size={[0.8, 0.2, 0.06]} color={C.orange} position={[-0.28, 1.2, 0]} rotation={[0, -0.4, 0]} radius={0.03} />
        <Box size={[0.7, 0.2, 0.06]} color={C.coral} position={[0.22, 0.9, 0]} rotation={[0, 0.9, 0]} radius={0.03} />
      </group>
      <Bench position={[0.1, 0, -0.5]} />
      <LampPost position={[-2, 0, -0.6]} />
    </group>
  );
}
