"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { exhibitFor } from "@/content/projects";
import type { Section } from "@/content/sections";
import { intro } from "./introStore";
import { flight } from "./overlayState";
import { asked } from "./pickStore";
import { riseClock } from "./voxel/Voxels";
import { groundY } from "./voxel/terrain";
import { walker } from "./walker";
import { exhibit } from "./voxel/exhibitData";
import { orbit, orbited, resetOrbit } from "./orbit";

/** How long the opening flight lasts, in seconds. */
const INTRO_SECONDS = 9;
/** How long a move between sections lasts, in seconds. */
const MOVE_SECONDS = 1.8;
const FOV = 35;
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
const landingDirection = new THREE.Vector3();

/** How long the camera takes to settle after the opening lands, in seconds. */
const SETTLE_SECONDS = 1.1;
/** How far it carries on past its resting place before springing back, as a share of its distance. */
const OVERSHOOT = 0.075;

/**
 * With a project open, the camera comes in this much closer to its exhibit than the section's
 * own view, and sits this much lower, so the work he is doing can be seen.
 */
const CLOSER = 0.7;
const LOWER = 1.5;
const aimOffset = new THREE.Vector3();
/** The screen wider than this has the card down its left side; the action is moved right of it. */
const WIDE = 900;
/** The screen narrower than this has the card along the bottom; the action is moved above it. */
const NARROW = 560;

type View = { position: [number, number, number]; target: [number, number, number] };
/** At the camp, a question widens the view to take in whatever answers it. */
const CAMP_VIEW: View = { position: [9.2, 12.4, 42.5], target: [0.4, 8.5, 24.5] };
/** "What have you done?" looks past him and out over the valley. */
const VALLEY_VIEW: View = { position: [3.5, 15, 41], target: [3.5, 5, -2] };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smoothstep = (a: number, c: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (c - a)));
  return x * x * (3 - 2 * x);
};

type Move = { from: THREE.Vector3; fromTarget: THREE.Vector3; t: number };

/**
 * Flies the opening shot, then carries the camera between sections in a timed arc that lifts
 * over the rooftops, while the character makes his own way there. At rest, the visitor can turn
 * the view (see orbit.ts). Jumps straight to the section when motion is reduced.
 */
export function CameraRig({ section, project, animate }: { section: Section; project: string | null; animate: boolean }) {
  const target = useRef<THREE.Vector3 | null>(null);
  /** The exhibit of the open project, which he goes and works at. */
  const work = project ? (exhibitFor(project)?.id ?? null) : null;
  const shownWork = useRef(work);
  const flown = useRef(0);
  const shown = useRef(section.id);
  const move = useRef<Move | null>(null);
  const flying = useRef(false);
  /** Seconds since the opening landed, while the camera is still settling. */
  const settling = useRef(-1);
  /** The settling nudge added last frame, taken off again before this frame is worked out. */
  const nudge = useRef(new THREE.Vector3());
  /** How far the picture is shifted, in pixels, to keep the action clear of the card. */
  const shift = useRef({ x: 0, y: 0 });

  useFrame(({ camera, scene, size, pointer }, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const step = Math.min(delta, 0.1);
    camera.position.sub(nudge.current);
    nudge.current.set(0, 0, 0);
    // On tall, narrow screens, step back so the subject still fits.
    const aspect = size.width / size.height;
    const pullBack = aspect < 1.25 ? Math.min(1.25 / aspect, 2.2) : 1;
    const piece = work ? exhibit(work) : null;
    /** Where the camera should be, before any turning by the visitor. */
    const aim = () => {
      const ask = section.id === "about" ? asked.get() : "";
      const view: View = ask === "done" ? VALLEY_VIEW : ask ? CAMP_VIEW : section.camera;
      goalTarget.set(...view.target);
      goalPosition.set(...view.position);
      const offset = aimOffset.copy(goalPosition).sub(goalTarget).multiplyScalar(pullBack);
      if (piece) {
        // Come in on the exhibit he is working at, along the section's own line of sight.
        goalTarget.set(piece.x, groundY(piece.x, piece.z) + 1.6, piece.z + 0.4);
        offset.multiplyScalar(CLOSER).y -= LOWER;
      }
      goalPosition.copy(goalTarget).add(offset);
    };
    aim();
    // Then turn it however the visitor has turned the view.
    if (orbit.turned) goalPosition.set(...orbited(goalPosition.toArray(), goalTarget.toArray(), groundY));

    // First frame without an opening flight: start at the section, do not glide in from the sky.
    if (!target.current) {
      target.current = goalTarget.clone();
      // Arriving by a direct link, he is already there.
      walker.place(section.id, work);
      if (intro.get() !== "playing") camera.position.copy(goalPosition);
    }

    let fov = FOV;

    if (intro.get() === "playing") {
      // Each time the opening starts (including a replay), begin from the top.
      if (!flying.current) {
        flying.current = true;
        flown.current = 0;
        resetOrbit();
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
      // The opening just landed: carry on a little past the resting place, then spring back.
      if (flying.current && animate && flown.current >= 1) settling.current = 0;
      flying.current = false;
      flight.progress = 1;
      riseClock.value = 100;
      if (shown.current !== section.id) {
        shown.current = section.id;
        // Each section opens on its own view, however the last one was left.
        resetOrbit();
        aim();
        shownWork.current = work;
        if (animate) {
          walker.go(section.id, work);
          move.current = { from: camera.position.clone(), fromTarget: target.current.clone(), t: 0 };
        } else {
          walker.place(section.id, work);
          move.current = null;
        }
      } else if (shownWork.current !== work) {
        // Another project in the same section (or back to its list): he steps over to it, and the
        // view glides gently in on it (or back out), with no lift.
        shownWork.current = work;
        resetOrbit();
        aim();
        if (animate) walker.go(section.id, work);
        else walker.place(section.id, work);
      }

      const m = move.current;
      if (m) {
        m.t += step / MOVE_SECONDS;
        const e = easeInOut(Math.min(1, m.t));
        // Rise in the middle of the move, so the camera clears the village instead of flying through it.
        const lift = Math.min(12, m.from.distanceTo(goalPosition) * 0.3);
        camera.position.lerpVectors(m.from, goalPosition, e);
        camera.position.y += Math.sin(Math.PI * e) * lift;
        target.current.lerpVectors(m.fromTarget, goalTarget, e);
        if (m.t >= 1) move.current = null;
      } else if (animate) {
        // At rest, drift a little with the pointer so the scene feels alive, until the visitor
        // takes hold of the view; then follow their hand closely.
        if (!orbit.turned) {
          goalPosition.x += pointer.x * 0.6;
          goalPosition.y += pointer.y * 0.3;
        }
        const ease = 1 - Math.exp(-(orbit.dragging ? 16 : orbit.turned ? 7 : 2.4) * step);
        camera.position.lerp(goalPosition, ease);
        target.current.lerp(goalTarget, ease);
      } else {
        camera.position.copy(goalPosition);
        target.current.copy(goalTarget);
      }
    }

    if (settling.current >= 0) {
      settling.current += step;
      const k = settling.current / SETTLE_SECONDS;
      if (k >= 1 || move.current) settling.current = -1;
      else {
        // A damped swing: forward towards the subject, a little back, then still.
        const reach = camera.position.distanceTo(goalTarget) * OVERSHOOT;
        const swing = Math.sin(k * Math.PI * 1.5) * Math.exp(-k * 2.6) * reach;
        landingDirection.subVectors(goalTarget, camera.position).normalize();
        nudge.current.copy(landingDirection).multiplyScalar(swing);
        nudge.current.y -= swing * 0.25;
        camera.position.add(nudge.current);
      }
    }

    // Keep the action clear of the page's card: to its right on a wide screen, above it on a
    // phone. Not during the opening, which has the screen to itself.
    const opening = intro.get() === "playing";
    const wantX = opening ? 0 : size.width >= WIDE ? -Math.min(240, size.width * 0.16) : 0;
    const wantY = opening || section.id === "home" ? 0 : size.width <= NARROW ? size.height * 0.2 : 0;
    const glide = animate ? 1 - Math.exp(-4 * step) : 1;
    shift.current.x += (wantX - shift.current.x) * glide;
    shift.current.y += (wantY - shift.current.y) * glide;
    const shifted = Math.abs(shift.current.x) > 0.5 || Math.abs(shift.current.y) > 0.5;
    camera.fov = fov;
    if (shifted) camera.setViewOffset(size.width, size.height, shift.current.x, shift.current.y, size.width, size.height);
    else if (camera.view?.enabled) camera.clearViewOffset();
    camera.updateProjectionMatrix();
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
