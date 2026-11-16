"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { engine, sfx } from "@/audio/engine";
import { ambienceMix } from "@/audio/mix";
import { daylight } from "./daylight";
import { intro } from "./introStore";
import { flight } from "./overlayState";
import { riseClock } from "./voxel/Voxels";
import { walker } from "./walker";

/** Blocks travelled between footsteps. */
const STRIDE = 1.15;
const look = new THREE.Vector3();

/**
 * Listens to the world and plays the matching sounds: footsteps as he runs, a chime when he
 * arrives, the whoosh and the landing blocks of the opening, and background sounds that follow
 * where the camera is looking. Draws nothing.
 */
export function SoundEvents() {
  const stepped = useRef(0);
  const wasMoving = useRef(false);
  const lastIntro = useRef(intro.get());
  const whooshed = useRef(false);
  const nextThunk = useRef(0);
  const mixClock = useRef(0);

  // In development, let checks confirm sound is really coming out.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __soundLevel?: () => number }).__soundLevel = () => engine.level();
  }, []);

  useFrame(({ camera }, delta) => {
    const step = Math.min(delta, 0.1);

    // Footsteps, faster as he speeds up, and a chime on arrival.
    if (walker.moving) {
      stepped.current += walker.speed * step;
      if (stepped.current > STRIDE) {
        stepped.current = 0;
        sfx.step();
      }
    } else if (wasMoving.current) {
      stepped.current = 0;
      sfx.chime();
    }
    wasMoving.current = walker.moving;

    // The opening: blocks thud into place as the land rises, then the wind as the camera dives.
    const state = intro.get();
    if (state === "playing" && lastIntro.current !== "playing") {
      whooshed.current = false;
      nextThunk.current = 0.9;
    }
    lastIntro.current = state;
    if (state === "playing") {
      const rise = riseClock.value;
      if (rise >= nextThunk.current && rise < 3) {
        sfx.thunk();
        nextThunk.current = rise + 0.09 + Math.random() * 0.12 + (rise - 0.9) * 0.05;
      }
      if (!whooshed.current && flight.progress > 0.3) {
        whooshed.current = true;
        sfx.whoosh(4);
      }
    }

    // A few times a second, set the background sounds from the spot the camera is looking at.
    mixClock.current += step;
    if (mixClock.current > 0.15) {
      mixClock.current = 0;
      camera.getWorldDirection(look);
      const down = Math.min(-0.05, look.y);
      const reach = Math.min(80, (camera.position.y - 4) / -down);
      const x = camera.position.x + look.x * reach * 0.7;
      const z = camera.position.z + look.z * reach * 0.7;
      engine.setAmbience(ambienceMix({ x, z }, daylight.night));
    }
  });

  return null;
}
