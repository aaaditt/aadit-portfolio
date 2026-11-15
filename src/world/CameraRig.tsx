"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Section } from "@/content/sections";
import { intro } from "./introStore";
import { flight } from "./overlayState";
import { riseClock } from "./voxel/Voxels";
import { walker } from "./walker";

/** How long the opening flight lasts, in seconds. */
const INTRO_SECONDS = 9;
/** How long a move between sections lasts, in seconds. */
const MOVE_SECONDS = 1.8;
const FOV = 35;
/** Where the camera sits while following a run: how far to the side, above and south of him. */
const CHASE = [5, 10, 16];
/** The opening starts zoomed in, like a flat game map, and widens as the camera drops. */
const MAP_FOV = 30;
/** The share of the opening spent holding the map view before the camera descends. */
const HOLD = 0.27;

// The opening flight: it starts looking straight down like a game map, then swoops round the
// west side of the valley and settles at the lookout.
const FLIGHT = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 112, 24),
    new THREE.Vector3(-18, 62, 30),
    new THREE.Vector3(-36, 34, 30),
    new THREE.Vector3(-28, 20, 46),
    new THREE.Vector3(-6, 14, 50),
  ],
  false,
  "centripetal",
);
const FLIGHT_LOOK_FROM = new THREE.Vector3(0, 0, 0);

const goalPosition = new THREE.Vector3();
const goalTarget = new THREE.Vector3();
const flightPoint = new THREE.Vector3();
const chasePosition = new THREE.Vector3();
const chaseTarget = new THREE.Vector3();

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smoothstep = (a: number, c: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (c - a)));
  return x * x * (3 - 2 * x);
};

/** `run` is true when the character is running there and the camera goes with him. */
type Move = { from: THREE.Vector3; fromTarget: THREE.Vector3; t: number; run: boolean };

/**
 * Flies the opening shot. Between sections it follows the character as he runs there, then
 * settles into the section's own view. Where there is no run to follow, it crosses in a timed
 * arc that lifts over the rooftops. Jumps straight to the section when motion is reduced.
 */
export function CameraRig({ section, animate }: { section: Section; animate: boolean }) {
  const target = useRef<THREE.Vector3 | null>(null);
  const flown = useRef(0);
  const shown = useRef(section.id);
  const move = useRef<Move | null>(null);
  const flying = useRef(false);
  /** Which way he is running, east (+) or west (-), smoothed. The camera hangs back on that side. */
  const lean = useRef(0);

  useFrame(({ camera, scene, size, pointer }, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
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
      // Arriving by a direct link, he is already there.
      walker.place(section.id);
      if (intro.get() !== "playing") camera.position.copy(goalPosition);
    }

    let fov = FOV;

    if (intro.get() === "playing") {
      // Each time the opening starts (including a replay), begin from the top.
      if (!flying.current) {
        flying.current = true;
        flown.current = 0;
      }
      // The first frames stall while the world is prepared. Do not count those, or the
      // flight would be half over before anything has been seen.
      if (delta < 0.12) flown.current += delta / INTRO_SECONDS;
      flight.progress = Math.min(1, flown.current);
      // The land rises out of the lake in a wave from the village.
      riseClock.value = flown.current * INTRO_SECONDS;
      // Hold the map view for the first 30% while that happens, then fly down.
      // A smoothstep leaves the map promptly instead of lingering on it.
      const t = smoothstep(HOLD, 1, flight.progress);
      FLIGHT.getPoint(t, flightPoint);
      // Hand over from the flight path to the real resting place over the last stretch.
      camera.position.copy(flightPoint).lerp(goalPosition, smoothstep(0.72, 1, t));
      target.current.copy(FLIGHT_LOOK_FROM).lerp(goalTarget, smoothstep(0.35, 1, t));
      fov = MAP_FOV + (FOV - MAP_FOV) * smoothstep(0.15, 0.8, t);
      if (flown.current >= 1) intro.finish();
    } else {
      flying.current = false;
      flight.progress = 1;
      riseClock.value = 100;
      if (shown.current !== section.id) {
        shown.current = section.id;
        if (animate) {
          const run = walker.go(section.id);
          move.current = { from: camera.position.clone(), fromTarget: target.current.clone(), t: 0, run };
        } else {
          walker.place(section.id);
          move.current = null;
        }
      }

      const m = move.current;
      if (m?.run) {
        m.t = walker.moving ? walker.progress : 1;
        // Follow from above on the valley's open south side, a little behind him to east or west.
        lean.current += (Math.sin(walker.heading) - lean.current) * (1 - Math.exp(-3 * step));
        chaseTarget.set(walker.x, walker.y + 2, walker.z);
        chasePosition.set(-lean.current * CHASE[0], CHASE[1], CHASE[2]).multiplyScalar(pullBack).add(chaseTarget);
        // Swing in behind him as he sets off, and out to the section's view as he arrives.
        const join = smoothstep(0, 0.3, m.t);
        const leave = smoothstep(0.58, 1, m.t);
        camera.position.lerpVectors(m.from, chasePosition, join).lerp(goalPosition, leave);
        target.current.lerpVectors(m.fromTarget, chaseTarget, join).lerp(goalTarget, leave);
        if (m.t >= 1) move.current = null;
      } else if (m) {
        m.t += step / MOVE_SECONDS;
        const e = easeInOut(Math.min(1, m.t));
        // Rise in the middle of the move, so the camera clears the village instead of flying through it.
        const lift = Math.min(12, m.from.distanceTo(goalPosition) * 0.3);
        camera.position.lerpVectors(m.from, goalPosition, e);
        camera.position.y += Math.sin(Math.PI * e) * lift;
        target.current.lerpVectors(m.fromTarget, goalTarget, e);
        if (m.t >= 1) move.current = null;
      } else if (animate) {
        // At rest, drift a little with the pointer so the scene feels alive.
        goalPosition.x += pointer.x * 0.6;
        goalPosition.y += pointer.y * 0.3;
        const ease = 1 - Math.exp(-2.4 * step);
        camera.position.lerp(goalPosition, ease);
        target.current.lerp(goalTarget, ease);
      } else {
        camera.position.copy(goalPosition);
        target.current.copy(goalTarget);
      }
    }

    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(target.current);

    // Push the haze back as the camera climbs, so the map view from high up stays clear.
    if (scene.fog instanceof THREE.Fog) {
      const lift = Math.max(0, camera.position.y - 18) * 1.7;
      scene.fog.near = 45 + lift;
      scene.fog.far = 150 + lift;
    }
  });

  return null;
}
