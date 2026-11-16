"use client";

import { theme, useTheme } from "./themeStore";
import styles from "./BottomBar.module.css";

/** Pixel sun and moon, drawn on the same 24-unit grid as the bar's other icons. */
const SUN = (
  <>
    <rect x="9" y="8" width="6" height="8" />
    <rect x="8" y="9" width="8" height="6" />
    <rect x="11" y="2" width="2" height="3" />
    <rect x="11" y="19" width="2" height="3" />
    <rect x="2" y="11" width="3" height="2" />
    <rect x="19" y="11" width="3" height="2" />
    <rect x="5" y="5" width="2" height="2" />
    <rect x="17" y="5" width="2" height="2" />
    <rect x="5" y="17" width="2" height="2" />
    <rect x="17" y="17" width="2" height="2" />
  </>
);

const MOON = (
  <>
    <rect x="9" y="3" width="6" height="2" />
    <rect x="7" y="5" width="4" height="2" />
    <rect x="5" y="7" width="4" height="10" />
    <rect x="7" y="17" width="4" height="2" />
    <rect x="9" y="19" width="6" height="2" />
    <rect x="15" y="17" width="4" height="2" />
    <rect x="9" y="15" width="8" height="2" />
    <rect x="17" y="13" width="2" height="2" />
    <rect x="16" y="6" width="2" height="2" />
    <rect x="19" y="9" width="2" height="2" />
  </>
);

/**
 * Switches the page and the world between day and night. It shows where it will take you:
 * a moon by day, a sun by night.
 */
export function ThemeToggle() {
  const current = useTheme();
  const next = current === "night" ? "Day" : "Night";

  return (
    <button type="button" className={styles.item} title={`Switch to ${next.toLowerCase()}`} onClick={() => theme.toggle()}>
      <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
        {current === "night" ? SUN : MOON}
      </svg>
      <span className={styles.label}>
        <span className={styles.hidden}>Switch to </span>
        {next}
      </span>
    </button>
  );
}
