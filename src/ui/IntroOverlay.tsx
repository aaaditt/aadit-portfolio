"use client";

import { useEffect, useRef } from "react";
import { intro, useIntro } from "@/world/introStore";
import { flight, hover, mapLabels } from "@/world/overlayState";
import { PixelLetter } from "./pixelArt";
import styles from "./IntroOverlay.module.css";

/** If the world has not loaded after this long, show the page anyway. */
const GIVE_UP_MS = 8000;

/**
 * Everything drawn over the world that is not page content:
 * - a title card while the world loads, so the first thing seen is never an empty sky;
 * - cinema bars, district name tags and a skip button during the opening flight;
 * - the name tag that follows the pointer over a clickable landmark.
 * It also publishes the intro state on <html data-intro> so plain CSS can reveal the page when it ends.
 */
export function IntroOverlay() {
  const state = useIntro();
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const tag = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    document.documentElement.dataset.intro = state;
  }, [state]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (intro.get() === "pending") intro.finish();
    }, GIVE_UP_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") intro.finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  // Follow the scene: place the district tags and the pointer tag every frame.
  useEffect(() => {
    let frame = 0;
    let mouseX = 0;
    let mouseY = 0;
    const onMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };
    const follow = () => {
      const showLabels = intro.get() === "playing" && flight.progress > 0.14 && flight.progress < 0.36;
      labels.current.forEach((el, i) => {
        if (!el) return;
        el.style.left = `${mapLabels[i].x}px`;
        // Keep the tags clear of the cinema bars at the top and bottom.
        const y = Math.min(Math.max(mapLabels[i].y, window.innerHeight * 0.16), window.innerHeight * 0.84);
        el.style.top = `${y}px`;
        el.style.opacity = showLabels ? "1" : "0";
      });
      if (tag.current) {
        tag.current.textContent = hover.text;
        tag.current.style.left = `${mouseX}px`;
        tag.current.style.top = `${mouseY}px`;
        tag.current.style.opacity = hover.text ? "1" : "0";
      }
      frame = requestAnimationFrame(follow);
    };
    window.addEventListener("pointermove", onMove);
    frame = requestAnimationFrame(follow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const playing = state === "playing";

  return (
    <div className={styles.overlay} data-playing={playing} data-loading={state === "pending"}>
      <div className={styles.cover} aria-hidden={state !== "pending"}>
        <p className={styles.wordmark} aria-label="Aadit">
          {[..."AADIT"].map((letter, i) => (
            <PixelLetter key={i} letter={letter} />
          ))}
        </p>
        <p className={styles.loading} role="status">
          Loading world
        </p>
      </div>

      {mapLabels.map((label, i) => (
        <span key={label.text} ref={(el) => void (labels.current[i] = el)} className={styles.label} aria-hidden="true">
          {label.text}
        </span>
      ))}

      <div className={`${styles.bar} ${styles.top}`} aria-hidden="true" />
      <div className={`${styles.bar} ${styles.bottom}`}>
        <p className={styles.caption} aria-hidden="true">
          <span>Aadit</span> · a portfolio
        </p>
        {playing && (
          <button type="button" className={styles.skip} onClick={() => intro.finish()}>
            Skip intro
          </button>
        )}
      </div>

      <span ref={tag} className={styles.tag} aria-hidden="true" />
    </div>
  );
}
