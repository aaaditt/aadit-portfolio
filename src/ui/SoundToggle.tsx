"use client";

import { soundSetting, useSound } from "@/audio/soundStore";
import { pixels } from "./pixelArt";
import styles from "./BottomBar.module.css";

const SPEAKER_ON = ["....#....", "...##...#", "####..#.#", "####.#..#", "####.#..#", "####.#..#", "####..#.#", "...##...#", "....#...."];
const SPEAKER_OFF = ["....#....", "...##....", "####.#..#", "####..##.", "####..##.", "####.#..#", "####.....", "...##....", "....#...."];

/** Turns the music and sound effects on and off. Sound starts off; the choice is remembered. */
export function SoundToggle() {
  const on = useSound();
  return (
    <button
      type="button"
      className={`${styles.item} ${styles.toggle}`}
      aria-pressed={on}
      title={on ? "Turn sound off" : "Turn sound on"}
      onClick={() => soundSetting.toggle()}
    >
      <svg className={styles.icon} viewBox="0 0 9 9" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
        {pixels(on ? SPEAKER_ON : SPEAKER_OFF)}
      </svg>
      <span className={styles.label}>Sound</span>
    </button>
  );
}
