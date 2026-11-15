"use client";

import { useEffect } from "react";
import { intro, useIntro } from "@/world/introStore";
import styles from "./IntroOverlay.module.css";

/** If the world has not loaded after this long, show the page anyway. */
const GIVE_UP_MS = 8000;

/**
 * Cinema bars and a skip button during the opening flight.
 * Also publishes the intro state on <html data-intro> so plain CSS can reveal the page when it ends.
 */
export function IntroOverlay() {
  const state = useIntro();

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

  const playing = state === "playing";

  return (
    <div className={styles.overlay} data-playing={playing} aria-hidden={!playing}>
      <div className={`${styles.bar} ${styles.top}`} />
      <div className={`${styles.bar} ${styles.bottom}`}>
        <p className={styles.caption}>
          <span>Aadit</span> · a portfolio
        </p>
      </div>
      {playing && (
        <button type="button" className={styles.skip} onClick={() => intro.finish()}>
          Skip intro
        </button>
      )}
    </div>
  );
}
