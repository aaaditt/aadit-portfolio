"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Section } from "@/content/sections";
import { intro } from "./introStore";

/** How long the opening flight lasts, in seconds. */
const INTRO_SECONDS = 9;

// The opening flight: it starts looking straight down like a game map, then swoops round the
// west side of the valley and settles at the lookout.
const FLIGHT = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 76, 22),
    new THREE.Vector3(-18, 58, 30),
    new THREE.Vector3(-36, 34, 30),
    new THREE.Vector3(-28, 20, 46),
    new THREE.Vector3(-6, 14, 50),
  ],
  false,
  "centripetal",
);
const FLIGHT_LOOK_FROM = new THREE.Vector3(0, 0, -8);

const goalPosition = new THREE.Vector3();
const goalTarget = new THREE.Vector3();
const flightPoint = new THREE.Vector3();

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smoothstep = (a: number, c: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (c - a)));
  return x * x * (3 - 2 * x);
};

/**
 * Flies the opening shot, then glides the camera to whichever section is open.
 * Jumps straight to the section when motion is reduced.
 */
export function CameraRig({ section, animate }: { section: Section; animate: boolean }) {
  const target = useRef<THREE.Vector3 | null>(null);
  const flown = useRef(0);

  useFrame(({ camera, size, pointer }, delta) => {
    const step = Math.min(delta, 0.1);
    goalTarget.set(...section.camera.target);
    goalPosition.set(...section.camera.position);

    // On tall, narrow screens, step back so the subject still fits.
    const aspect = size.width / size.height;
    const pullBack = aspect < 1.25 ? Math.min(1.25 / aspect, 2.2) : 1;
    goalPosition.sub(goalTarget).multiplyScalar(pullBack).add(goalTarget);

    // First frame without an opening flight: start at the section, do not glide in from the sky.
    if (!target.current) {
      target.current = goalTarget.clone();
      if (intro.get() !== "playing") camera.position.copy(goalPosition);
    }

    if (intro.get() === "playing") {
      // Real time, not frame count, so a slow machine still gets a 9-second flight.
      flown.current += Math.min(delta, 0.5) / INTRO_SECONDS;
      const t = easeInOut(Math.min(1, flown.current));
      FLIGHT.getPoint(t, flightPoint);
      // Hand over from the flight path to the real resting place over the last stretch.
      camera.position.copy(flightPoint).lerp(goalPosition, smoothstep(0.72, 1, t));
      target.current.copy(FLIGHT_LOOK_FROM).lerp(goalTarget, smoothstep(0.35, 1, t));
      camera.lookAt(target.current);
      if (flown.current >= 1) intro.finish();
      return;
    }

    // A little drift with the pointer makes the scene feel alive.
    if (animate) {
      goalPosition.x += pointer.x * 1.2;
      goalPosition.y += pointer.y * 0.6;
      const ease = 1 - Math.exp(-2.4 * step);
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
