"use client";

import { useState, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import type { Section } from "@/content/sections";
import { CameraRig } from "./CameraRig";
import { MotionContext } from "./scene/primitives";
import { Scene } from "./scene/Scene";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Only ever rendered in the browser (see World). */
export default function WorldInner({ section }: { section: Section }) {
  const [supported] = useState(hasWebGL);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );

  if (!supported) return null;

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: section.camera.position, fov: 35, near: 0.5, far: 220 }}
      // The page's own headings and links describe the content; the scene is decoration.
      aria-hidden="true"
    >
      <MotionContext.Provider value={!reduced}>
        <CameraRig section={section} animate={!reduced} />
        <Scene />
      </MotionContext.Provider>
    </Canvas>
  );
}
