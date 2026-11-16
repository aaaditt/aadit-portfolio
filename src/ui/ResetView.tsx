"use client";

import { useEffect, useRef } from "react";
import { orbit, resetOrbit } from "@/world/orbit";
import styles from "./ResetView.module.css";

/** A small button that appears once the visitor has turned the world, and puts the view back. */
export function ResetView() {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const follow = () => {
      const el = ref.current;
      if (el) {
        el.classList.toggle(styles.on, orbit.turned);
        el.tabIndex = orbit.turned ? 0 : -1;
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <button ref={ref} type="button" className={styles.button} tabIndex={-1} onClick={() => resetOrbit()}>
      <span aria-hidden="true">↺</span> Reset view
    </button>
  );
}
