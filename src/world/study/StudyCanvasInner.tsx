"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import type { Mood } from "../moods";
import { StudyScene } from "./StudyScene";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Only ever rendered in the browser (see StudyCanvas). */
export default function StudyCanvasInner({ mood, interactive = false }: { mood: Mood; interactive?: boolean }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [supported] = useState(hasWebGL);
  const reduced = usePrefersReducedMotion();

  // Stop drawing while scrolled out of view, so three canvases don't all run at once.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapper} style={{ width: "100%", height: "100%", background: mood.palette.sky }}>
      {supported ? (
        <Canvas
          shadows={mood.light.shadows}
          dpr={[1, 1.5]}
          frameloop={visible ? "always" : "never"}
          camera={{ position: [9, 6.5, 11], fov: 35 }}
          aria-label={`3D scene study: ${mood.name}`}
        >
          <StudyScene mood={mood} interactive={interactive} animate={!reduced} />
        </Canvas>
      ) : (
        <p style={{ color: mood.palette.text, padding: "2rem", margin: 0 }}>
          This browser can&apos;t show 3D graphics, so the {mood.name} scene can&apos;t be displayed here.
        </p>
      )}
    </div>
  );
}
