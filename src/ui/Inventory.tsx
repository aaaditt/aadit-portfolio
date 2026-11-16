"use client";

import Link from "next/link";
import type { Project } from "@/content/projects";
import { highlight } from "@/world/overlayState";
import { ProjectThumb } from "./ProjectThumb";
import styles from "@/app/[section]/page.module.css";

/**
 * A section's projects as a row of inventory slots, like a game's item bag. Pointing at a slot
 * lights up its exhibit in the world, so the two are clearly the same thing.
 */
export function Inventory({ projects, base }: { projects: Project[]; base: string }) {
  const point = (id: string) => () => void (highlight.project = id);
  const leave = () => void (highlight.project = "");

  return (
    <ul className={styles.inventory} aria-label="Projects">
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            href={`${base}/${p.id}`}
            className={styles.slot}
            onPointerEnter={point(p.id)}
            onPointerLeave={leave}
            onFocus={point(p.id)}
            onBlur={leave}
            onClick={leave}
          >
            <ProjectThumb project={p} className={styles.slotPicture} />
            <span className={styles.slotName}>{p.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
