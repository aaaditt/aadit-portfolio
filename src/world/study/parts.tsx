"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Mood } from "../moods";

type Vec3 = [number, number, number];

/** The surface of an object, drawn the way the mood asks for. */
export function Skin({ mood, color, fill }: { mood: Mood; color: string; fill?: string }) {
  const dark = useMemo(() => new THREE.Color(color).multiplyScalar(0.1), [color]);

  if (mood.material === "glow") {
    return (
      <meshStandardMaterial
        color={dark}
        emissive={color}
        emissiveIntensity={0.22}
        roughness={0.6}
        flatShading
      />
    );
  }
  if (mood.material === "line") {
    return (
      <meshBasicMaterial
        color={fill ?? mood.palette.sky}
        transparent
        opacity={0.6}
        polygonOffset
        polygonOffsetFactor={1}
      />
    );
  }
  return <meshStandardMaterial color={color} roughness={0.9} flatShading={mood.shape !== "rounded"} />;
}

/** The drawn edges of an object. Soft moods have none. */
export function Outline({ mood, color }: { mood: Mood; color: string }) {
  const bright = useMemo(() => new THREE.Color(color).multiplyScalar(2.2), [color]);

  if (mood.material === "soft") return null;
  return (
    <Edges threshold={20}>
      <lineBasicMaterial color={mood.material === "glow" ? bright : color} toneMapped={false} />
    </Edges>
  );
}

/** A box that follows the mood's shape language. */
export function Block({
  mood,
  color,
  size,
  position,
}: {
  mood: Mood;
  color: string;
  size: Vec3;
  position?: Vec3;
}) {
  if (mood.shape === "rounded") {
    const radius = Math.min(...size) * 0.22;
    return (
      <RoundedBox args={size} radius={radius} smoothness={4} position={position} castShadow receiveShadow>
        <Skin mood={mood} color={color} />
      </RoundedBox>
    );
  }
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Skin mood={mood} color={color} />
      <Outline mood={mood} color={color} />
    </mesh>
  );
}

export function Island({ mood }: { mood: Mood }) {
  const sides = mood.shape === "rounded" ? 48 : 6;
  const p = mood.palette;
  return (
    <group>
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5, 0.6, sides]} />
        <Skin mood={mood} color={p.ground} fill={p.ground} />
        <Outline mood={mood} color={p.secondary} />
      </mesh>
      <mesh position={[0, -1.9, 0]}>
        <cylinderGeometry args={[4.7, 1.4, 2.6, sides]} />
        <Skin mood={mood} color={mood.material === "soft" ? "#b08968" : p.secondary} fill={p.sky} />
        <Outline mood={mood} color={p.secondary} />
      </mesh>
      {mood.shape === "wire" && (
        <gridHelper args={[7, 14, p.secondary, p.secondary]} position={[0, 0.01, 0]} />
      )}
    </group>
  );
}

export function Building({ mood, position }: { mood: Mood; position: Vec3 }) {
  const p = mood.palette;
  const roofSides = mood.shape === "rounded" ? 32 : 4;
  return (
    <group position={position}>
      <Block mood={mood} color={p.primary} size={[2.2, 1.8, 2]} position={[0, 0.9, 0]} />
      <mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[mood.shape === "rounded" ? 1.5 : 1.75, 1.1, roofSides]} />
        <Skin mood={mood} color={p.secondary} />
        <Outline mood={mood} color={p.secondary} />
      </mesh>
      <Block mood={mood} color={p.accent} size={[0.5, 0.9, 0.1]} position={[0, 0.45, 1.02]} />
      <Block mood={mood} color={p.accent} size={[0.4, 0.4, 0.1]} position={[-0.7, 1.15, 1.02]} />
      <Block mood={mood} color={p.accent} size={[0.4, 0.4, 0.1]} position={[0.7, 1.15, 1.02]} />
    </group>
  );
}

export function Tree({ mood, position, scale = 1 }: { mood: Mood; position: Vec3; scale?: number }) {
  const p = mood.palette;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 1, mood.shape === "rounded" ? 12 : 5]} />
        <Skin mood={mood} color={mood.material === "soft" ? "#8d6e63" : p.secondary} />
        <Outline mood={mood} color={p.secondary} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        {mood.shape === "rounded" && <sphereGeometry args={[0.75, 20, 16]} />}
        {mood.shape === "sharp" && <coneGeometry args={[0.75, 1.6, 4]} />}
        {mood.shape === "wire" && <octahedronGeometry args={[0.8, 0]} />}
        <Skin mood={mood} color={p.accent} />
        <Outline mood={mood} color={p.accent} />
      </mesh>
    </group>
  );
}

export function Character({
  mood,
  position,
  animate,
}: {
  mood: Mood;
  position: Vec3;
  animate: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const p = mood.palette;

  useFrame(({ clock }) => {
    if (!ref.current || !animate) return;
    const t = clock.elapsedTime;
    ref.current.position.y = position[1] + Math.abs(Math.sin(t * 2.2)) * 0.12;
    ref.current.rotation.y = Math.sin(t * 0.8) * 0.35;
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        {mood.shape === "rounded" && <capsuleGeometry args={[0.28, 0.4, 8, 16]} />}
        {mood.shape === "sharp" && <cylinderGeometry args={[0.18, 0.36, 0.95, 4]} />}
        {mood.shape === "wire" && <cylinderGeometry args={[0.2, 0.32, 0.95, 6]} />}
        <Skin mood={mood} color={p.character} />
        <Outline mood={mood} color={p.character} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        {mood.shape === "rounded" && <sphereGeometry args={[0.3, 20, 16]} />}
        {mood.shape === "sharp" && <boxGeometry args={[0.46, 0.46, 0.46]} />}
        {mood.shape === "wire" && <icosahedronGeometry args={[0.32, 0]} />}
        <Skin mood={mood} color={p.character} />
        <Outline mood={mood} color={p.character} />
      </mesh>
    </group>
  );
}

const GLYPHS: Record<string, string[]> = {
  A: [".##.", "#..#", "####", "#..#", "#..#"],
  D: ["###.", "#..#", "#..#", "#..#", "###."],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
};

/** The name, built from small blocks on a pixel grid so it needs no font file. */
export function NameSign({ mood, text, position }: { mood: Mood; text: string; position: Vec3 }) {
  const cell = 0.24;
  const blocks = useMemo(() => {
    const out: Vec3[] = [];
    let x = 0;
    for (const ch of text) {
      const glyph = GLYPHS[ch];
      if (!glyph) continue;
      glyph.forEach((row, r) => {
        [...row].forEach((c, col) => {
          if (c === "#") out.push([(x + col) * cell, (4 - r) * cell, 0]);
        });
      });
      x += glyph[0].length + 1;
    }
    const width = (x - 1) * cell;
    return out.map(([bx, by, bz]) => [bx - width / 2 + cell / 2, by + cell / 2, bz] as Vec3);
  }, [text]);

  return (
    <group position={position}>
      {blocks.map((b, i) => (
        <Block key={i} mood={mood} color={mood.palette.text} size={[cell * 0.92, cell * 0.92, cell * 0.92]} position={b} />
      ))}
    </group>
  );
}
