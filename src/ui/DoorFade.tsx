"use client";

import { useEffect, useRef } from "react";
import { tent } from "@/world/tentStore";

/** The dark of the tent's doorway, drawn over the world as the camera goes in or out. */
export function DoorFade() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const follow = () => {
      // Eased so it is mostly dark early: it reads as stepping into the dark, not a tint.
      if (ref.current) ref.current.style.opacity = String(1 - Math.pow(1 - tent.fade, 2.2));
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div ref={ref} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 1, background: "#0d0805", opacity: 0, pointerEvents: "none" }} />;
}
