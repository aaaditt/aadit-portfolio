"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, sectionForPath, type SectionId } from "@/content/sections";
import styles from "./BottomBar.module.css";

const ICONS: Record<SectionId, ReactNode> = {
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 10v9.5h11V10" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  design: (
    <>
      <path d="m14.5 5.5 4 4L8 20H4v-4L14.5 5.5Z" />
      <path d="m12.5 7.5 4 4" />
    </>
  ),
  code: (
    <>
      <path d="m8.5 8-4.5 4 4.5 4" />
      <path d="m15.5 8 4.5 4-4.5 4" />
      <path d="m13.5 5.5-3 13" />
    </>
  ),
  play: (
    <>
      <rect x="3" y="7.5" width="18" height="10" rx="5" />
      <path d="M7.5 11v3M6 12.5h3" />
      <path d="M15.2 13.6h.01M17.6 11.4h.01" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
};

/** The floating bar at the bottom of every page. */
export function BottomBar() {
  const current = sectionForPath(usePathname());

  return (
    <nav className={styles.bar} aria-label="Sections">
      <ul className={styles.list}>
        {SECTIONS.map((section) => {
          const active = section.id === current.id;
          return (
            <li key={section.id}>
              <Link
                href={section.href}
                className={active ? `${styles.item} ${styles.active}` : styles.item}
                aria-current={active ? "page" : undefined}
              >
                <svg
                  className={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONS[section.id]}
                </svg>
                <span className={styles.label}>{section.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
