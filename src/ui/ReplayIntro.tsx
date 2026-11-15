"use client";

import { intro } from "@/world/introStore";
import styles from "./ReplayIntro.module.css";

/** A small button on the home page that plays the opening flight again. */
export function ReplayIntro() {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => intro.replay()}
    >
      <span aria-hidden="true">▶</span> Replay intro
    </button>
  );
}
