"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import type { Section } from "@/content/sections";
import { CameraRig } from "./CameraRig";
import { intro, useIntro } from "./introStore";
import { MotionContext } from "./motion";
import { OrbitInput } from "./OrbitInput";
import { Outlines } from "./Outlines";
import { Scene } from "./Scene";
import { SoundEvents } from "./SoundEvents";

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * The world is drawn small and scaled up with hard edges, which is what makes it look pixelated.
 * Each drawn pixel covers a whole number of real screen pixels (about two CSS pixels), so the
 * blocks stay crisp on displays scaled to 125% or 150% as well as 100%.
 */
function pixelRatio() {
  const device = window.devicePixelRatio || 1;
  return device / Math.max(2, Math.round(2 * device));
}

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
export default function WorldInner({ section, project, onOpen }: { section: Section; project: string | null; onOpen: (href: string) => void }) {
  const [supported] = useState(hasWebGL);
  const [dpr] = useState(pixelRatio);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const introState = useIntro();

  // Decide once, on arrival, whether to play the opening flight.
  useEffect(() => {
    if (intro.get() !== "pending") return;
    const play = supported && section.id === "home" && !window.matchMedia(REDUCED).matches && !intro.seen();
    if (play) intro.start();
    else intro.finish();
    // Only the arrival page matters, so this runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  return (
    <Canvas
      // Hard-edged shadows and untouched colours suit the pixel look.
      shadows="basic"
      flat
      dpr={dpr}
      gl={{ antialias: false, alpha: true }}
      camera={{ position: [0, 112, 24], fov: 30, near: 0.5, far: 400 }}
      // touchAction: a finger dragged over the world turns it, not the page.
      style={{ imageRendering: "pixelated", touchAction: "none" }}
      // The page's own headings and links describe the content; the scene is decoration.
      aria-hidden="true"
    >
      <MotionContext.Provider value={!reduced}>
        <CameraRig section={section} project={project} animate={!reduced} />
        <OrbitInput />
        <Outlines />
        <SoundEvents />
        <Scene
          greet={introState === "done" && (section.id === "home" || section.id === "about")}
          current={section.id}
          project={project}
          onOpen={onOpen}
        />
      </MotionContext.Provider>
    </Canvas>
  );
}
