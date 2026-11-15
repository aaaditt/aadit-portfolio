"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Section } from "@/content/sections";

const goalPosition = new THREE.Vector3();
const goalTarget = new THREE.Vector3();

/** Glides the camera to the current section's viewpoint. Jumps straight there when motion is reduced. */
export function CameraRig({ section, animate }: { section: Section; animate: boolean }) {
  const target = useRef<THREE.Vector3 | null>(null);

  useFrame(({ camera, size, pointer }, delta) => {
    goalTarget.set(...section.camera.target);
    goalPosition.set(...section.camera.position);

    // On tall, narrow screens, step back so the subject still fits.
    const aspect = size.width / size.height;
    const pullBack = aspect < 1.25 ? Math.min(1.25 / aspect, 2.4) : 1;
    goalPosition.sub(goalTarget).multiplyScalar(pullBack).add(goalTarget);

    // A little drift with the pointer makes the scene feel alive.
    if (animate) {
      goalPosition.x += pointer.x * 0.9;
      goalPosition.y += pointer.y * 0.45;
    }

    if (!target.current) {
      target.current = goalTarget.clone();
      camera.position.copy(goalPosition);
    } else if (animate) {
      const ease = 1 - Math.exp(-2.6 * Math.min(delta, 0.1));
      camera.position.lerp(goalPosition, ease);
      target.current.lerp(goalTarget, ease);
    } else {
      camera.position.copy(goalPosition);
      target.current.copy(goalTarget);
    }

    camera.lookAt(target.current);
  });

  return null;
}
