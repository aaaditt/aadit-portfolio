"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, sectionForPath } from "@/content/sections";
import { ICON_ROWS, pixels } from "./pixelArt";
import { sfx } from "@/audio/engine";
import { SoundToggle } from "./SoundToggle";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./BottomBar.module.css";

/** The floating bar at the bottom of every page. */
export function BottomBar() {
  const current = sectionForPath(usePathname());

  return (
    <nav className={`${styles.bar} reveal`} aria-label="Sections">
      <ul className={styles.list}>
        {SECTIONS.map((section) => {
          const active = section.id === current.id;
          return (
            <li key={section.id}>
              <Link
                href={section.href}
                className={active ? `${styles.item} ${styles.active}` : styles.item}
                aria-current={active ? "page" : undefined}
                onClick={() => sfx.click()}
              >
                <svg className={styles.icon} viewBox="0 0 9 9" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
                  {pixels(ICON_ROWS[section.id])}
                </svg>
                <span className={styles.label}>{section.label}</span>
              </Link>
            </li>
          );
        })}
        <li className={styles.divider} aria-hidden="true" />
        <li>
          <ThemeToggle />
        </li>
        <li>
          <SoundToggle />
        </li>
      </ul>
    </nav>
  );
}
