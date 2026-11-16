"use client";

import { whereIs, type Project } from "@/content/projects";
import { highlight } from "@/world/overlayState";
import styles from "@/app/[section]/page.module.css";

/** Where the project's exhibit stands in the world. Pointing at it makes that exhibit bounce. */
export function WorkingAt({ project }: { project: Project }) {
  const point = () => void (highlight.project = project.id);
  const leave = () => void (highlight.project = "");
  return (
    <p className={styles.where} onPointerEnter={point} onPointerLeave={leave}>
      <span aria-hidden="true">◆</span> In the world: {whereIs(project)}
    </p>
  );
}
