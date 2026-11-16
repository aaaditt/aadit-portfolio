"use client";

import { ICON_ROWS, pixels } from "./pixelArt";
import { theme, useTheme } from "./themeStore";
import styles from "./BottomBar.module.css";

/**
 * Switches the page and the world between day and night. It shows where it will take you:
 * a moon by day, a sun by night.
 */
export function ThemeToggle() {
  const current = useTheme();
  const next = current === "night" ? "Day" : "Night";

  return (
    <button type="button" className={styles.item} title={`Switch to ${next.toLowerCase()}`} onClick={() => theme.toggle()}>
      <svg className={styles.icon} viewBox="0 0 9 9" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
        {pixels(current === "night" ? ICON_ROWS.sun : ICON_ROWS.moon)}
      </svg>
      <span className={styles.label}>
        <span className={styles.hidden}>Switch to </span>
        {next}
      </span>
    </button>
  );
}
