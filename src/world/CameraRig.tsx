"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { exhibitFor } from "@/content/projects";
import type { Section } from "@/content/sections";
import { intro } from "./introStore";
import { flight } from "./overlayState";
import { asked } from "./pickStore";
import { driftWeight, handover } from "./landingRule";
import { fogRange, stageFov, stageStepBack, viewDrop } from "./stageRule";
import { cameraMove, stage } from "./stageStore";
import { CREDENTIALS } from "@/content/about";
import { ROOM_FOV, roomCamera, roomSize } from "./show/trophyRule";
import { ROOM_AT, tent } from "./tentStore";
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
    // Ends beside the resting view, so the last second is one curve that arrives, not a blend of two.
    new THREE.Vector3(4.8, 14.3, 48.4),
  ],
  false,
  "centripetal",
);
const FLIGHT_LOOK_FROM = new THREE.Vector3(0, 0, 0);

const goalPosition = new THREE.Vector3();
const goalTarget = new THREE.Vector3();
const flightPoint = new THREE.Vector3();

/**
 * With a project open, the camera comes in this much closer to its exhibit than the section's
 * own view, and sits this much lower, so the work he is doing can be seen.
 */
const CLOSER = 0.7;
const LOWER = 1.5;
const aimOffset = new THREE.Vector3();
const stagePoint = new THREE.Vector3();
/** The screen wider than this has the card down its left side; the action is moved right of it. */
const WIDE = 900;

type View = { position: [number, number, number]; target: [number, number, number] };
/** At the camp, a question widens the view to take in whatever answers it. */
const CAMP_VIEW: View = { position: [9.2, 12.4, 42.5], target: [0.4, 8.5, 24.5] };
/** "What have you done?" looks past him and out over the valley. */
const VALLEY_VIEW: View = { position: [-4, 37, 50], target: [-4, 2, -8] };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smoothstep = (a: number, c: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (c - a)));
  return x * x * (3 - 2 * x);
};

type Move = { from: THREE.Vector3; fromTarget: THREE.Vector3; t: number };

const ROOM = roomSize(CREDENTIALS);

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
  /** Seconds since the camera last came to rest, after the opening or a move. */
  const resting = useRef(0);
  /** During the opening, how far it has handed over to the resting view, 0 to 1. */
  const landing = useRef(0);
  /** Whether the camera was inside the trophy tent last frame. */
  const wasInside = useRef(false);
  /** How far the picture is shifted, in pixels, to keep the action clear of the card. */
  const shift = useRef({ x: 0, y: 0 });

  useFrame(({ camera, scene, size, pointer }, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const step = Math.min(delta, 0.1);
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
      if (tent.inside) {
        // Inside the trophy tent: square on to the shelves, far enough back to take in the wall.
        // The page's card leaves only part of the screen clear: on a desktop the third to the
        // right of the picture's middle, on a phone the band above the sheet.
        const free = size.width >= WIDE ? { across: 0.68, down: 1 } : size.width <= 560 ? { across: 1, down: 0.48 } : { across: 1, down: 1 };
        const at = roomCamera(ROOM, aspect, free);
        goalTarget.set(ROOM_AT[0], ROOM_AT[1] + at.height, ROOM_AT[2]);
        goalPosition.set(ROOM_AT[0], ROOM_AT[1] + at.height + 0.4, ROOM_AT[2] + at.distance);
        return;
      }
      const offset = aimOffset.copy(goalPosition).sub(goalTarget).multiplyScalar(pullBack);
      if (section.id === "home" && aspect < 1) {
        // On a tall phone the full pull-back loses the camp in hillside and water: stay closer,
        // and look a little higher.
        offset.multiplyScalar(0.8);
        goalTarget.y += 1.5;
      }
      if (piece) {
        // Come in on the show at the exhibit he is working at, along the section's own line of sight.
        goalTarget.set(piece.x, groundY(piece.x, piece.z) + 1.6, piece.z + 0.4);
        // Once staged, the camera looks at the show itself, which stands above or in front of the exhibit.
        if (stage.level > 0) goalTarget.lerp(stagePoint.set(stage.x, stage.y, stage.z), Math.min(1, stage.level * 1.5));
        offset.multiplyScalar(CLOSER).y -= LOWER;
        // The long lens of a staged show would bring it too close: step back as the lens narrows,
        // so the show grows in the frame without filling it.
        offset.multiplyScalar(stageStepBack(stage.level));
      }
      goalPosition.copy(goalTarget).add(offset);
    };
    aim();
    // Then turn it however the visitor has turned the view.
    if (orbit.turned) goalPosition.set(...orbited(goalPosition.toArray(), goalTarget.toArray(), groundY));

    // Going into or out of the trophy tent happens behind the dark of the doorway: the camera
    // simply is in its new place when the dark lifts.
    if (tent.inside !== wasInside.current && target.current) {
      wasInside.current = tent.inside;
      camera.position.copy(goalPosition);
      target.current.copy(goalTarget);
      move.current = null;
    }

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
      landing.current = handover(t);
      resting.current = 0;
      camera.position.copy(flightPoint).lerp(goalPosition, landing.current);
      target.current.copy(FLIGHT_LOOK_FROM).lerp(goalTarget, smoothstep(0.35, 1, t));
      fov = MAP_FOV + (FOV - MAP_FOV) * smoothstep(0.15, 0.8, t);
      if (flown.current >= 1) intro.finish();
    } else {
      // The opening has landed exactly on the resting view, so there is nothing left to settle.
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
        cameraMove.progress = Math.min(1, m.t);
        resting.current = 0;
        if (m.t >= 1) move.current = null;
      } else if (animate) {
        cameraMove.progress = 1;
        resting.current += step;
        // At rest, drift a little with the pointer so the scene feels alive, until the visitor
        // takes hold of the view; then follow their hand closely. The drift fades in after
        // arriving, so a landing holds still instead of sliding off towards the pointer.
        if (!orbit.turned) {
          const drift = driftWeight(resting.current);
          goalPosition.x += pointer.x * 0.6 * drift;
          goalPosition.y += pointer.y * 0.3 * drift;
        }
        const ease = 1 - Math.exp(-(orbit.dragging ? 16 : orbit.turned ? 7 : 2.4) * step);
        camera.position.lerp(goalPosition, ease);
        target.current.lerp(goalTarget, ease);
      } else {
        cameraMove.progress = 1;
        camera.position.copy(goalPosition);
        target.current.copy(goalTarget);
      }
    }

    // Keep the action clear of the page's card: to its right on a wide screen, above it on a
    // phone. The opening starts centred and moves into this framing as it lands, in step with
    // the camera, so it arrives composed instead of sliding over afterwards.
    const opening = intro.get() === "playing";
    const share = opening ? landing.current : 1;
    const wantX = (size.width >= WIDE ? -Math.min(240, size.width * 0.16) : 0) * share;
    // A wide stage keeps the ordinary framing and lens.
    const lens = stage.wide ? 0 : stage.level;
    const wantY = (section.id === "home" ? 0 : size.height * viewDrop(lens, size.width)) * share;
    const glide = opening || !animate ? 1 : 1 - Math.exp(-4 * step);
    shift.current.x += (wantX - shift.current.x) * glide;
    shift.current.y += (wantY - shift.current.y) * glide;
    const shifted = Math.abs(shift.current.x) > 0.5 || Math.abs(shift.current.y) > 0.5;
    // A staged show is seen through a long lens: flatter, and bigger in the frame.
    camera.fov = opening ? fov : tent.inside ? ROOM_FOV : stageFov(lens, size.width);
    if (shifted) camera.setViewOffset(size.width, size.height, shift.current.x, shift.current.y, size.width, size.height);
    else if (camera.view?.enabled) camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.lookAt(target.current);

    // Push the haze back as the camera climbs, so the map view from high up stays clear.
    if (scene.fog instanceof THREE.Fog) {
      const lift = Math.max(0, camera.position.y - 18) * 1.7;
      // While staged, it closes in round the show instead.
      const range = fogRange(camera.position.distanceTo(stagePoint.set(stage.x, stage.y, stage.z)), stage.level);
      scene.fog.near = range.near + lift * (1 - stage.level);
      scene.fog.far = range.far + lift * (1 - stage.level);
    }
  });

  return null;
}
