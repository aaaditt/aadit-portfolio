"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { sfx } from "@/audio/engine";
import { SECTIONS } from "@/content/sections";
import { mapLabels } from "@/world/overlayState";
import { asked } from "@/world/pickStore";
import styles from "./ValleyTags.module.css";

/** The places he points out, in the order the world reports where they are (see mapLabels). */
const PLACES = ["design", "code", "events"].map((id) => SECTIONS.find((s) => s.id === id)!);

/**
 * Name tags over the studio, the lab and the Grounds, shown when he is asked what he has done and
 * points out over the valley. Each is a link to its place. The card offers the same three links.
 */
export function ValleyTags() {
  const on = useSyncExternalStore(
    asked.subscribe,
    () => asked.get() === "done",
    () => false,
  );
  const tags = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!on) return;
    let frame = 0;
    const began = performance.now();
    const follow = () => {
      // Wait for the view to swing round to the valley before the tags appear.
      const settled = performance.now() - began > 900;
      tags.current.forEach((el, i) => {
        if (!el) return;
        // Kept on the screen, so a place off to one side can still be picked.
        const half = el.offsetWidth / 2 + 12;
        el.style.left = `${Math.min(Math.max(mapLabels[i].x, half), window.innerWidth - half)}px`;
        el.style.top = `${Math.min(Math.max(mapLabels[i].y, 70), window.innerHeight - 120)}px`;
        el.classList.toggle(styles.on, settled && mapLabels[i].x !== 0);
      });
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [on]);

  if (!on) return null;

  return (
    <nav aria-label="Places in the valley">
      {PLACES.map((place, i) => (
        <Link key={place.id} href={place.href} ref={(el) => void (tags.current[i] = el)} className={styles.tag} onClick={() => sfx.click()}>
          {place.label} <span aria-hidden="true">▶</span>
        </Link>
      ))}
    </nav>
  );
}
