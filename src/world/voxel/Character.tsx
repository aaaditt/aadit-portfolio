"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sfx } from "@/audio/engine";
import { bubbleAnchor } from "../bubbleAnchor";
import { intro } from "../introStore";
import { wasDrag } from "../orbit";
import { hover } from "../overlayState";
import { useMotion } from "../motion";
import { walker } from "../walker";
import { b, type Box } from "./box";
import { faceFor } from "./expression";
import { Voxels } from "./Voxels";

// Colours taken from Aadit's profile picture: curly dark hair, navy hoodie.
const SKIN = "#a9744b";
const SKIN_D = "#93623e";
const HAIR = "#1f1a1b";
const HAIR_L = "#3b2e2a";
const HOODIE = "#34447a";
const HOODIE_D = "#2a3763";
const TEE = "#f1eee6";
const PANTS = "#2a2b33";
const SHOE = "#ecebe6";
const FACE = "#2a1d18";

/** One model pixel, in world units. The character is about 3.4 blocks tall. */
const U = 0.17;

const LEG_L: Box[] = [b(-3, -5, -1.5, 2.6, 5, 3, PANTS), b(-3.1, -5.8, -1.5, 2.8, 0.8, 3.8, SHOE)];
const LEG_R: Box[] = [b(0.4, -5, -1.5, 2.6, 5, 3, PANTS), b(0.3, -5.8, -1.5, 2.8, 0.8, 3.8, SHOE)];

const TORSO: Box[] = [
  b(-3.5, 0, -2, 7, 6.5, 4, HOODIE),
  b(-3.7, 0, -2.2, 7.4, 0.7, 4.4, HOODIE_D),
  b(-2, 1, 2, 4, 1.7, 0.25, HOODIE_D),
  b(-3, 5.4, -3.1, 6, 1.7, 1.6, HOODIE_D),
  b(-1.1, 5.9, 1.7, 2.2, 0.6, 0.4, TEE),
  b(-0.9, 3.9, 2, 0.25, 2, 0.15, TEE),
  b(0.65, 3.9, 2, 0.25, 2, 0.15, TEE),
];

const HEAD: Box[] = [
  b(-3, 0, -3, 6, 6, 6, SKIN),
  b(-3.5, 2, -0.7, 0.5, 1.5, 1.2, SKIN_D),
  b(3, 2, -0.7, 0.5, 1.5, 1.2, SKIN_D),
  // nose; the eyes, brows and mouth change with his mood and are drawn separately (FACE_PARTS)
  b(-0.4, 2, 3, 0.8, 0.9, 0.35, SKIN_D),
  // hair: a cap, the back and sides, then uneven curls on top and a fringe
  b(-3.5, 5.4, -3.5, 7, 2, 7, HAIR),
  b(-3.5, 1.8, -3.7, 7, 4, 1.2, HAIR),
  b(-3.6, 3.8, -2.6, 0.7, 2, 4, HAIR),
  b(2.9, 3.8, -2.6, 0.7, 2, 4, HAIR),
  b(-3, 7.4, -1.6, 2.2, 1, 2.2, HAIR_L),
  b(0.3, 7.4, 0.2, 2.4, 1.2, 2.2, HAIR),
  b(-1.2, 7.4, -3.2, 2.2, 0.8, 2, HAIR),
  b(1.6, 7.3, -2.6, 1.8, 0.9, 1.8, HAIR_L),
  b(-2.4, 7.3, 1, 1.8, 0.8, 1.9, HAIR),
  b(-3.2, 4.8, 3, 1.7, 1.3, 0.6, HAIR),
  b(-1.1, 5.2, 3, 1.9, 0.9, 0.7, HAIR_L),
  b(1.2, 4.9, 3, 2, 1.2, 0.6, HAIR),
  b(-4.2, 5.2, -1.5, 1, 1.6, 2.4, HAIR_L),
  b(3.3, 5.4, -0.5, 1, 1.5, 2.2, HAIR),
  b(-0.6, 8.2, -1.2, 1.6, 0.8, 1.6, HAIR_L),
  b(1.4, 8.1, 0.8, 1.3, 0.7, 1.3, HAIR),
  b(-2.6, 8, -0.2, 1.3, 0.7, 1.4, HAIR),
  b(-1.8, 6.4, 3.2, 1.4, 1.1, 0.7, HAIR_L),
  b(0.6, 6.5, 3.3, 1.5, 1, 0.6, HAIR),
  b(-3.9, 6.6, 1, 0.9, 1.2, 1.6, HAIR),
  b(3.1, 6.8, -2.6, 0.9, 1.1, 1.8, HAIR_L),
  b(-0.8, 6.2, -4.2, 2.4, 1.6, 0.9, HAIR),
];

/** The two eyes' left edges, in model pixels across the face. */
const EYE_X = [-2.2, 0.7];
const WHITE = "#f4efe6";
const MOUTH_IN = "#5a2a22";

/** Every changeable feature on the face. Only one eye shape and one mouth show at a time. */
const FACE_PARTS = {
  // open eyes: the whites, with the pupils drawn separately so they can look around
  open: EYE_X.map((x) => b(x + 0.15, 2.75, 3, 1.2, 0.9, 0.1, WHITE)),
  pupils: EYE_X.map((x) => b(x + 0.5, 2.75, 3.02, 0.55, 0.8, 0.12, FACE)),
  // mid-blink: a short line
  shut: EYE_X.map((x) => b(x, 3.05, 3, 1.5, 0.3, 0.12, FACE)),
  // the closed, smiling eyes from his profile picture
  happy: EYE_X.flatMap((x) => [b(x, 3.3, 3, 1.5, 0.5, 0.12, FACE), b(x - 0.3, 2.9, 3, 0.4, 0.55, 0.12, FACE), b(x + 1.4, 2.9, 3, 0.4, 0.55, 0.12, FACE)]),
  brows: EYE_X.map((x) => b(x - 0.1, 4.25, 3, 1.6, 0.35, 0.12, HAIR)),
  smile: [b(-1.2, 1.1, 3, 2.4, 0.3, 0.12, FACE), b(-1.6, 1.35, 3, 0.4, 0.3, 0.12, FACE), b(1.2, 1.35, 3, 0.4, 0.3, 0.12, FACE)],
  grin: [b(-1.3, 0.7, 3, 2.6, 0.85, 0.1, MOUTH_IN), b(-1.1, 1.25, 3.02, 2.2, 0.28, 0.12, WHITE), b(-1.7, 1.3, 3, 0.4, 0.35, 0.12, MOUTH_IN), b(1.3, 1.3, 3, 0.4, 0.35, 0.12, MOUTH_IN)],
  flat: [b(-0.9, 1.15, 3, 1.8, 0.28, 0.12, FACE)],
  o: [b(-0.45, 0.8, 3, 0.9, 0.85, 0.12, MOUTH_IN)],
  blush: [-2.9, 1.9].map((x) => b(x, 1.75, 3, 1, 0.45, 0.06, "#c46f55")),
};
type Part = keyof typeof FACE_PARTS;
const PARTS = Object.keys(FACE_PARTS) as Part[];

const anchor = new THREE.Vector3();

/** How long his jump lasts when clicked, in seconds, and how high it goes, in blocks. */
const POKE_SECONDS = 0.75;
const POKE_HEIGHT = 1.1;

// How far each arm swings forward and inward to fold across the chest.
const CROSSED_X = -1.05;
const CROSSED_Z = 0.95;

const ARM: Box[] = [b(-1, -5.5, -1, 2, 6, 2, HOODIE), b(-1.1, -5.6, -1.1, 2.2, 0.8, 2.2, HOODIE_D), b(-0.8, -6.8, -0.8, 1.6, 1.2, 1.6, SKIN)];
const BRUSH: Box[] = [b(-0.3, -8.8, -0.3, 0.6, 2.2, 0.6, "#8b6b4a"), b(-0.45, -9.7, -0.45, 0.9, 1, 0.9, "#c8553d")];

/**
 * Every joint that moves, as angles. Arms and legs swing forward when negative; an arm's
 * `Side` angle lifts it out to the side when positive on the right and negative on the left.
 */
type Pose = { armR: number; armRSide: number; armL: number; armLSide: number; legR: number; legL: number; lean: number; sway: number; hop: number };

const pose: Pose = { armR: 0, armRSide: 0, armL: 0, armLSide: 0, legR: 0, legL: 0, lean: 0, sway: 0, hop: 0 };

/** Turns `from` towards `to` by the shorter way round. */
function turn(from: number, to: number, amount: number) {
  const gap = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + gap * amount;
}

/**
 * Aadit, in blocks. He runs to whichever section is open and gets on with something there:
 * painting, typing, playing, or standing at the lookout with a wave. `greet` shows the speech bubble.
 */
export function Character({ greet }: { greet: boolean }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const brush = useRef<THREE.Group>(null);
  const animate = useMotion();
  /** When he last started greeting, so the first wave comes straight away. */
  const wavedAt = useRef(-1);
  /** How far through his stride he is, as an angle. */
  const stride = useRef(0);
  /** The joints as drawn, which ease towards the pose he is aiming for. */
  const shown = useRef<Pose>({ ...pose });
  const facing = useRef(walker.heading);
  const wasRunning = useRef(false);
  const landedAt = useRef(-10);
  const parts = useRef<Partial<Record<Part, THREE.Group | null>>>({});
  /** When the visitor last clicked him, by the scene clock. */
  const pokedAt = useRef(-10);
  const clockNow = useRef(0);

  useFrame(({ clock, camera, size, pointer }, delta) => {
    const step = Math.min(delta, 0.1);
    walker.advance(step);
    const running = walker.moving;
    const place = walker.section;
    const atLookout = place === "home" || place === "about";
    const t = animate ? clock.elapsedTime : 0;
    clockNow.current = clock.elapsedTime;
    // Clicked: a jump and a full spin, arms up. Not while he is running somewhere.
    const sincePoke = clock.elapsedTime - pokedAt.current;
    const poked = sincePoke < POKE_SECONDS && !running;
    const jump = poked && animate ? sincePoke / POKE_SECONDS : 0;
    // With motion reduced, everything snaps to a still pose.
    const ease = (rate: number) => (animate ? 1 - Math.exp(-rate * step) : 1);

    // Wave on arrival at the lookout, then every so often.
    const greeting = greet && !running;
    if (greeting && wavedAt.current < 0) wavedAt.current = t;
    if (!greeting) wavedAt.current = -1;
    const cycle = wavedAt.current < 0 || !animate ? 99 : (t - wavedAt.current) % 13;
    const up = cycle < 3 ? Math.min(1, cycle * 3) : Math.max(0, 1 - (cycle - 3) * 3);

    pose.lean = 0;
    pose.sway = 0;
    pose.hop = Math.abs(Math.sin(t * 2)) * 0.06;
    pose.legR = 0;
    pose.legL = 0;
    if (running) {
      // The faster he goes, the faster his legs turn over, up to a limit the eye can still follow.
      stride.current += Math.min(21, 6 + walker.speed * 0.9) * step;
      const swing = Math.sin(stride.current);
      pose.legR = swing * 0.95;
      pose.legL = -swing * 0.95;
      pose.armR = -swing * 1.15 - 0.25;
      pose.armL = swing * 1.15 - 0.25;
      pose.armRSide = 0.14;
      pose.armLSide = -0.14;
      pose.lean = 0.24;
      // Highest with the legs at full stretch, which is what makes it a run and not a walk.
      pose.hop = Math.abs(Math.sin(stride.current)) * 0.3;
    } else if (jump > 0) {
      // Both arms flung up, legs tucked at the top of the jump.
      pose.armR = -0.3;
      pose.armRSide = 2.5;
      pose.armL = -0.3;
      pose.armLSide = -2.5;
      pose.legR = -0.5 * Math.sin(Math.PI * jump);
      pose.legL = -0.5 * Math.sin(Math.PI * jump);
      pose.hop = Math.sin(Math.PI * jump) * POKE_HEIGHT;
    } else if (place === "design") {
      // Painting: brush arm up at the canvas, making strokes.
      pose.armR = -1.4 + Math.sin(t * 3.1) * 0.22;
      pose.armRSide = -0.2 + Math.sin(t * 2.3) * 0.2;
      pose.armL = 0.1;
      pose.armLSide = -0.3;
      pose.lean = 0.04;
    } else if (place === "code") {
      // Typing: both hands out in front, tapping in turn.
      pose.armR = -1.1 + Math.max(0, Math.sin(t * 11)) * 0.4;
      pose.armL = -1.1 + Math.max(0, Math.sin(t * 11 + 2)) * 0.4;
      pose.armRSide = -0.2;
      pose.armLSide = 0.2;
      pose.lean = 0.06;
    } else if (place === "play") {
      // Playing: one hand on the stick, the other hammering a button, leaning into it.
      pose.armR = -1.05;
      pose.armRSide = -0.22 + Math.sin(t * 5.2) * 0.24;
      pose.armL = -1 + Math.max(0, Math.sin(t * 9)) * 0.22;
      pose.armLSide = 0.22;
      pose.lean = 0.1;
      pose.sway = Math.sin(t * 5.2) * 0.05;
    } else {
      // Arms crossed, as in the profile picture, with one unfolding to wave.
      pose.armR = CROSSED_X * (1 - up);
      pose.armRSide = up * (2.55 + Math.sin(t * 9) * 0.32) - (1 - up) * CROSSED_Z;
      pose.armL = CROSSED_X + Math.sin(t * 2) * 0.03;
      pose.armLSide = CROSSED_Z;
    }

    // Arriving, he lands with a small hop and a squash.
    if (wasRunning.current && !running) landedAt.current = t;
    wasRunning.current = running;
    const landing = animate ? Math.max(0, 1 - (t - landedAt.current) / 0.3) : 0;
    const bump = Math.sin(Math.PI * landing);
    if (landing > 0) pose.hop = bump * 0.35;

    const now = shown.current;
    const k = ease(running || jump > 0 ? 30 : 12);
    for (const key of Object.keys(pose) as (keyof Pose)[]) now[key] += (pose[key] - now[key]) * k;

    if (root.current) {
      // Look around a little at the lookout; face the work everywhere else.
      const focus = walker.focus;
      const want =
        focus && !running && !atLookout
          ? Math.atan2(focus.x - walker.x, focus.z - walker.z)
          : walker.heading + (atLookout && !running ? Math.sin(t * 0.5) * 0.18 : 0);
      facing.current = animate ? turn(facing.current, want, ease(running ? 14 : 7)) : want;
      root.current.position.set(walker.x, walker.y + 5.8 * U + now.hop, walker.z);
      // The spin of a jump eases out, so he lands facing the way he was.
      const spin = jump > 0 ? (1 - Math.pow(1 - jump, 3)) * Math.PI * 2 : 0;
      root.current.rotation.set(now.lean, facing.current + spin, now.sway, "YXZ");
      root.current.scale.set(U * (1 + bump * 0.08), U * (1 - bump * 0.1), U * (1 + bump * 0.08));
    }
    if (armR.current) armR.current.rotation.set(now.armR, 0, now.armRSide);
    if (armL.current) armL.current.rotation.set(now.armL, 0, now.armLSide);
    if (legR.current) legR.current.rotation.x = now.legR;
    if (legL.current) legL.current.rotation.x = now.legL;
    if (brush.current) brush.current.visible = place === "design" && !running;

    if (head.current) {
      // At the lookout he looks towards the visitor's pointer. At work he watches what he is doing.
      const h = head.current.rotation;
      const follow = atLookout && !running ? 1 : 0.15;
      const wantY = (pointer.x * 0.6 + Math.sin(t * 0.7) * 0.08) * follow;
      const nod = place === "code" ? Math.sin(t * 5.5) * 0.07 : Math.sin(t * 1.3) * 0.05;
      const wantX = running ? -0.1 : atLookout ? -pointer.y * 0.3 : 0.16 + nod;
      h.z = Math.sin(t * 1.1) * 0.06;
      h.y += (wantY - h.y) * ease(5);
      h.x += (wantX - h.x) * ease(5);

      // His expression for the moment.
      const face = faceFor({ place, running, waving: up > 0.5, sinceLanding: t - landedAt.current, t, pointerX: pointer.x, animate, poked });
      const show = (part: Part, on: boolean) => {
        const group = parts.current[part];
        if (group) group.visible = on;
      };
      show("open", face.eyes === "open");
      show("pupils", face.eyes === "open");
      show("shut", face.eyes === "shut");
      show("happy", face.eyes === "happy");
      show("blush", face.blush);
      for (const mouth of ["smile", "grin", "flat", "o"] as const) show(mouth, face.mouth === mouth);
      const pupils = parts.current.pupils;
      if (pupils) pupils.position.x += (face.look * 0.3 - pupils.position.x) * ease(14);
      const brows = parts.current.brows;
      if (brows) brows.position.y += (face.brows - brows.position.y) * ease(12);

      // Tell the page where the speech bubble should sit: just above and beside the head.
      head.current.getWorldPosition(anchor);
      anchor.y += 10.5 * U;
      anchor.project(camera);
      bubbleAnchor.x = (anchor.x * 0.5 + 0.5) * size.width;
      bubbleAnchor.y = (-anchor.y * 0.5 + 0.5) * size.height;
      bubbleAnchor.visible = greeting && anchor.z < 1;
    }
  });

  return (
    <group ref={root} scale={U}>
      {/* Something to click: a see-through box round his whole body. */}
      <mesh
        position={[0, 4.8, 0]}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (intro.get() !== "done") return;
          hover.text = "Say hi";
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          hover.text = "";
          document.body.style.cursor = "";
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (wasDrag() || intro.get() !== "done" || walker.moving) return;
          if (clockNow.current - pokedAt.current < POKE_SECONDS) return;
          pokedAt.current = clockNow.current;
          sfx.chime();
        }}
      >
        <boxGeometry args={[10, 22, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={legL}>
        <Voxels boxes={LEG_L} />
      </group>
      <group ref={legR}>
        <Voxels boxes={LEG_R} />
      </group>
      <Voxels boxes={TORSO} />
      <group ref={head} position={[0, 6.6, 0]}>
        <Voxels boxes={HEAD} />
        {PARTS.map((part) => (
          <group key={part} ref={(el) => void (parts.current[part] = el)} visible={part === "open" || part === "pupils" || part === "brows" || part === "smile"}>
            <Voxels boxes={FACE_PARTS[part]} shadows={false} />
          </group>
        ))}
      </group>
      <group ref={armR} position={[4.4, 5.9, 0]} rotation={[CROSSED_X, 0, -CROSSED_Z]}>
        <Voxels boxes={ARM} />
        <group ref={brush} visible={false}>
          <Voxels boxes={BRUSH} />
        </group>
      </group>
      <group ref={armL} position={[-4.4, 5.9, 0]} rotation={[CROSSED_X, 0, CROSSED_Z]}>
        <Voxels boxes={ARM} />
      </group>
    </group>
  );
}
