"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { exhibitFor } from "@/content/projects";
import type { SectionId } from "@/content/sections";
import { sfx } from "@/audio/engine";
import { daylight } from "../daylight";
import { useMotion } from "../motion";
import { asked } from "../pickStore";
import { GRADES, dimRadius, keyLevel, stageStep, type StagePlace } from "../stageRule";
import { cameraMove, stage, stageUniforms } from "../stageStore";
import { ROOM_AT, tent } from "../tentStore";
import type { Exhibit } from "../voxel/exhibitData";
import { groundY, plateau } from "../voxel/terrain";

/** Where the show of an exhibit is, measured from its foot: above the easel, the machine above the terminal, the crowd in front of the cart. */
const SHOW_AT: Record<Exhibit["kind"], [number, number, number]> = {
  easel: [0.5, 3.7, 1.2],
  terminal: [0, 4.3, 0.9],
  cart: [0, 1.4, 2.4],
};

/** The middle of the show for what is open, or null if nothing is. */
export function showCentre(current: SectionId, project: string | null): { place: StagePlace; x: number; y: number; z: number; wide?: boolean } | null {
  const e = project ? exhibitFor(project) : undefined;
  if (e && e.section === current && (current === "design" || current === "code" || current === "events")) {
    const [dx, dy, dz] = SHOW_AT[e.kind];
    return { place: current, x: e.x + dx, y: groundY(e.x, e.z) + dy, z: e.z + dz };
  }
  if (current === "about" && tent.inside) return { place: "about", x: ROOM_AT[0], y: ROOM_AT[1] + 2.5, z: ROOM_AT[2] + 1 };
  // Looking out over the valley, the stage is the whole valley: it darkens so the beams of light
  // rising from it are the brightest things there.
  if (current === "about" && asked.get() === "done") return { place: "about", x: 0, y: 4, z: -12, wide: true };
  if (current === "about" && asked.get()) {
    const camp = plateau("lookout");
    return { place: "about", x: camp.x + 0.4, y: camp.h + 2.2, z: camp.z + 1.2 };
  }
  return null;
}

const keyColour = new THREE.Color();
const toCamera = new THREE.Vector3();

/**
 * Puts the open item's show on a stage: once the camera is most of the way there, the world's
 * light drops and its fog closes in around the show (see DayNight), everything away from the show
 * dims (see Voxels), and one light comes on over the show itself, with a low thud as it lands.
 */
export function Stage({ current, project }: { current: SectionId; project: string | null }) {
  const animate = useMotion();
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const landed = useRef(false);

  // Leaving the site in staged state should never leave the page marked as staged.
  useEffect(() => () => void delete document.documentElement.dataset.stage, []);

  useFrame(({ camera }, delta) => {
    const show = showCentre(current, project);
    const on = show !== null && cameraMove.progress >= 0.6;
    if (show) {
      // A new show eases its place across; the very first one is simply put there.
      const glide = stage.level < 0.05 || !animate ? 1 : 1 - Math.exp(-6 * Math.min(delta, 0.05));
      stage.x += (show.x - stage.x) * glide;
      stage.y += (show.y - stage.y) * glide;
      stage.z += (show.z - stage.z) * glide;
      stage.place = show.place;
      stage.wide = Boolean(show.wide);
    }
    stage.level = stageStep(stage.level, on, Math.min(delta, 0.05), animate);
    // Going out, the key light leaves first.
    stage.key = on ? keyLevel(stage.level) : Math.max(0, stage.level * 2 - 1);

    if (on && stage.level >= 1 && !landed.current) {
      landed.current = true;
      if (animate) sfx.thunk();
    }
    if (!on) landed.current = false;

    stageUniforms.uStageCentre.value = [stage.x, stage.y, stage.z];
    // A wide stage, the whole valley, goes darker still, so the beams of light are the only bright things.
    stageUniforms.uStageDim.value = [dimRadius(stage.level), stage.level * (stage.wide ? 1.2 : 1)];

    const root = document.documentElement;
    if (stage.level > 0.4) root.dataset.stage = "on";
    else delete root.dataset.stage;

    const spot = light.current;
    if (spot) {
      const night = daylight.night;
      spot.intensity = stage.key * (3 + 1.5 * night);
      spot.visible = stage.key > 0.001;
      keyColour.set(GRADES[stage.place].key);
      spot.color.copy(keyColour);
      // Above the show and a little towards the camera, so it lights the faces we see.
      toCamera.set(camera.position.x - stage.x, 0, camera.position.z - stage.z).normalize();
      spot.position.set(stage.x + toCamera.x * 3, stage.y + 6, stage.z + toCamera.z * 3);
      target.position.set(stage.x, stage.y, stage.z);
      target.updateMatrixWorld();
    }
  });

  return (
    <>
      <primitive object={target} />
      <spotLight ref={light} target={target} angle={0.38} penumbra={0.6} decay={0} distance={0} intensity={0} castShadow={false} />
    </>
  );
}
