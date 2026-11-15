"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import type { Section } from "@/content/sections";
import { CameraRig } from "./CameraRig";
import { intro, useIntro } from "./introStore";
import { MotionContext } from "./motion";
import { Scene } from "./Scene";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** How many screen pixels each drawn pixel covers. This is what makes the world look pixelated. */
const PIXEL = 3;

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
export default function WorldInner({ section, onOpen }: { section: Section; onOpen: (href: string) => void }) {
  const [supported] = useState(hasWebGL);
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
      dpr={1 / PIXEL}
      gl={{ antialias: false, alpha: true }}
      camera={{ position: [0, 112, 24], fov: 30, near: 0.5, far: 400 }}
      style={{ imageRendering: "pixelated" }}
      // The page's own headings and links describe the content; the scene is decoration.
      aria-hidden="true"
    >
      <MotionContext.Provider value={!reduced}>
        <CameraRig section={section} animate={!reduced} />
        <Scene
          greet={introState === "done" && (section.id === "home" || section.id === "about")}
          current={section.id}
          onOpen={onOpen}
        />
      </MotionContext.Provider>
    </Canvas>
  );
}
