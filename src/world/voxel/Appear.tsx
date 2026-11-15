"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { landedAt, riseClock } from "./Voxels";

/**
 * Hides its children until the land beneath them has risen during the opening.
 * `distance` is how far they stand from the village plaza, where the rise begins.
 */
export function Appear({ distance, children }: { distance: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) ref.current.visible = riseClock.value >= landedAt(distance);
  });

  return <group ref={ref}>{children}</group>;
}
